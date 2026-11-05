#!/usr/bin/env python3
"""Jenkins Failure Diagnosis MCP Server.

Provides tools to authenticate to Jenkins, fetch build data,
download artifacts, and generate HTML failure reports.
"""

import asyncio
import base64
import json
import logging
import mimetypes
import os
import re
import subprocess
import sys
import webbrowser
import tempfile
import zipfile
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jenkins-mcp")

server = Server("jenkins-failure-diagnosis")

REPORTS_ROOT = Path.home() / "jenkins-reports"

# ---------------------------------------------------------------------------
# Jenkins HTTP client
# ---------------------------------------------------------------------------

@dataclass
class JenkinsClient:
    base_url: str
    username: str
    token: str
    _http: httpx.AsyncClient | None = field(default=None, repr=False)

    @property
    def http(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(
                auth=(self.username, self.token),
                timeout=httpx.Timeout(30.0, read=300.0),
                follow_redirects=True,
                verify=os.environ.get("JENKINS_VERIFY_SSL", "true").lower() == "true",
            )
        return self._http

    async def close(self):
        if self._http and not self._http.is_closed:
            await self._http.aclose()

    async def get_json(self, url: str) -> dict:
        api_url = url.rstrip("/") + "/api/json"
        resp = await self.http.get(api_url)
        resp.raise_for_status()
        return resp.json()

    async def get_text(self, url: str) -> str:
        resp = await self.http.get(url)
        resp.raise_for_status()
        return resp.text

    async def get_bytes(self, url: str) -> bytes:
        resp = await self.http.get(url)
        resp.raise_for_status()
        return resp.content

    async def download_to_file(self, url: str, dest: Path) -> None:
        """Stream a large download directly to disk with retries on chunked-read failures."""
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                async with self.http.stream("GET", url) as resp:
                    resp.raise_for_status()
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    with open(dest, "wb") as f:
                        async for chunk in resp.aiter_bytes(chunk_size=65536):
                            f.write(chunk)
                return
            except (httpx.RemoteProtocolError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                # Jenkins often closes the chunked transfer mid-stream for large
                # archives (≈40 MB with 24 failure screenshots). Retry the full
                # download; the zip is re-downloaded atomically on each attempt.
                if attempt == max_attempts:
                    raise
                logger.warning(
                    "Artifact download attempt %d/%d failed (%s) — retrying…",
                    attempt,
                    max_attempts,
                    e,
                )


def get_client() -> JenkinsClient:
    base_url = os.environ.get("JENKINS_URL", "")
    username = os.environ.get("JENKINS_USER", "")
    token = os.environ.get("JENKINS_TOKEN", "")
    if not all([base_url, username, token]):
        raise ValueError(
            "Missing Jenkins credentials. Set JENKINS_URL, JENKINS_USER, and JENKINS_TOKEN env vars."
        )
    return JenkinsClient(base_url=base_url.rstrip("/"), username=username, token=token)


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def _has_build_number(job_url: str) -> bool:
    """Return True if the URL already ends with a numeric build number."""
    return bool(re.search(r"/\d+$", job_url.rstrip("/")))


def normalize_job_url(job_url: str) -> str:
    """Ensure the URL points to a specific build (ends with a number)."""
    url = job_url.rstrip("/")
    if _has_build_number(url):
        return url
    return url + "/lastBuild"


async def resolve_job_url(client, job_url: str) -> str:
    """Resolve a job URL to a concrete build URL with a numeric build number.

    If the URL already contains a build number it is returned as-is.
    Otherwise the Jenkins API is queried for the last build number.
    """
    url = job_url.rstrip("/")
    if _has_build_number(url):
        return url
    data = await client.get_json(url + "/lastBuild")
    number = data.get("number")
    if number is None:
        raise ValueError(f"Could not resolve last build number for {url}")
    return f"{url}/{number}"


def parse_job_url(job_url: str) -> tuple[str, str]:
    """Extract (job_name, build_number) from a Jenkins build URL.

    Expects a URL that already contains a numeric build number
    (call resolve_job_url first for URLs without one).
    """
    url = job_url.rstrip("/")
    parts = url.split("/")
    build_number = parts[-1]
    job_idx = len(parts) - 2
    while job_idx >= 0 and parts[job_idx] == "job":
        job_idx -= 1
    job_name = parts[job_idx] if job_idx >= 0 else "unknown"
    return job_name, build_number


def job_output_dir(job_url: str) -> Path:
    """Return ~/jenkins-reports/<jobname>#<buildnumber>/"""
    name, number = parse_job_url(job_url)
    return REPORTS_ROOT / f"{name}#{number}"


# ---------------------------------------------------------------------------
# CNV-ID extraction
# ---------------------------------------------------------------------------

_CNV_ID_RE = re.compile(r"CNV-(\d+)")


def extract_cnv_ids(text: str) -> set[str]:
    """Return all CNV-XXXXX IDs found in a string."""
    return set(_CNV_ID_RE.findall(text))


# ---------------------------------------------------------------------------
# Test report parsing
# ---------------------------------------------------------------------------

def parse_test_failures(test_report: dict) -> list[dict]:
    """Extract failed test cases from Jenkins test report JSON, preserving execution order."""
    all_cases: list[dict] = []
    order = 0

    def walk_suites(suites):
        nonlocal order
        for suite in suites:
            suite_ts = suite.get("timestamp", "")
            for case in suite.get("cases", []):
                order += 1
                if case.get("status") in ("FAILED", "REGRESSION", "ERROR"):
                    class_name = case.get("className", "")
                    test_name = case.get("name", "")
                    combined = f"{class_name} {test_name}"
                    spec_file = ""
                    if ".cy.ts" in class_name:
                        for part in class_name.replace("\\", "/").split("/"):
                            if part.endswith(".cy.ts"):
                                spec_file = part
                                break
                    all_cases.append({
                        "class": class_name,
                        "name": test_name,
                        "status": case.get("status", ""),
                        "error_message": case.get("errorDetails", "") or "",
                        "stack_trace": case.get("errorStackTrace", "") or "",
                        "duration": case.get("duration", 0),
                        "stdout": case.get("stdout", "") or "",
                        "stderr": case.get("stderr", "") or "",
                        "cnv_ids": extract_cnv_ids(combined),
                        "spec_file": spec_file,
                        "suite_timestamp": suite_ts,
                        "exec_order": order,
                        "screenshots": [],
                        "videos": [],
                    })
            for child in suite.get("childReports", []):
                if "result" in child:
                    walk_suites(child["result"].get("suites", []))

    walk_suites(test_report.get("suites", []))
    for child in test_report.get("childReports", []):
        if "result" in child:
            walk_suites(child["result"].get("suites", []))

    all_cases.sort(key=lambda c: (c["suite_timestamp"], c["exec_order"]))
    return all_cases


def parse_cypress_artifact_failures(out_dir: Path) -> list[dict]:
    """Parse failed Cypress tests from the artifact archive when the Jenkins
    /testReport endpoint has no results.

    Prefers JUnit XML (one entry per failed test, including hook failures that
    mochawesome merges into a single card), falling back to the mochawesome
    JSON ('stats'+'results' shape). Returns failures in the same dict shape
    as parse_test_failures.
    """
    failures: list[dict] = []
    order = 0

    def add(suite_chain: list[str], title: str, err: dict, duration, full_file: str, status: str = "FAILED"):
        nonlocal order
        order += 1
        combined = " ".join(suite_chain + [title])
        spec_file = ""
        if ".cy.ts" in full_file:
            for part in full_file.replace("\\", "/").split("/"):
                if part.endswith(".cy.ts"):
                    spec_file = part
                    break
        failures.append({
            "class": title,
            "name": "  ".join(suite_chain + [title]),
            "status": status,
            "error_message": (err or {}).get("message", "") or "",
            "stack_trace": (err or {}).get("estack", "") or (err or {}).get("stack", "") or "",
            "duration": duration or 0,
            "stdout": "",
            "stderr": "",
            "cnv_ids": extract_cnv_ids(combined),
            "spec_file": spec_file,
            "suite_timestamp": "",
            "exec_order": order,
            "screenshots": [],
            "videos": [],
        })

    # 1. JUnit XML
    import xml.etree.ElementTree as ET
    for p in sorted(out_dir.rglob("*.xml")):
        try:
            root = ET.parse(p).getroot()
        except ET.ParseError:
            continue
        suites = root if root.tag == "testsuites" else [root]
        found = False
        for ts in suites:
            if ts.tag not in ("testsuites", "testsuite"):
                continue
            suite_name = ts.get("name") or ""
            for tc in ts.iter("testcase"):
                has_failure = tc.find("failure") is not None or tc.find("error") is not None
                if not has_failure:
                    continue
                found = True
                node = tc.find("failure") if tc.find("failure") is not None else tc.find("error")
                err = {"message": node.get("message", ""), "estack": (node.text or "")}
                add([], tc.get("name", ""), err, _parse_junit_time(tc.get("time")), ts.get("file") or "")
        if found:
            return failures

    # 2. mochawesome JSON fallback
    for p in out_dir.rglob("*.json"):
        if p.name == "archive.zip" or "/assets/" in str(p):
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8", errors="replace"))
        except (json.JSONDecodeError, OSError):
            continue
        if not isinstance(data, dict) or "results" not in data or "stats" not in data:
            continue

        def walk(suite: dict, chain: list[str]):
            full_file = suite.get("fullFile") or suite.get("file") or ""
            title = suite.get("title") or ""
            for t in suite.get("tests", []):
                if t.get("state") == "failed":
                    add(chain + [title] if title else chain, t.get("title", ""), t.get("err"), t.get("duration"), full_file)
            for c in suite.get("suites", []):
                walk(c, chain + ([title] if title else chain))

        for result in data.get("results", []):
            for suite in result.get("suites", []):
                walk(suite, [])
        if failures:
            return failures
    return failures


def _parse_junit_time(value: str | None) -> float:
    try:
        return float(value or 0)
    except ValueError:
        return 0.0


# ---------------------------------------------------------------------------
# Media matching
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    return re.sub(r"[\s_\-]+", "", text).lower()


def _extract_test_path_from_screenshot(filename: str) -> str:
    """Extract the test path from a Cypress screenshot filename.

    E.g. '1_Test VM actions -- ID(CNV-10539) pause VM (failed).png'
      -> 'test vm actions -- id(cnv-10539) pause vm'
    """
    name = Path(filename).stem
    # Strip leading number prefix: '1_...' or '018.'
    name = re.sub(r"^\d+[_.]", "", name)
    # Strip trailing ' (failed)' or ' (attempt N) (failed)'
    name = re.sub(r"\s*\(attempt \d+\)\s*\(failed\)\s*$", "", name)
    name = re.sub(r"\s*\(failed\)\s*$", "", name)
    return name.lower().strip()


def _build_failure_match_key(failure: dict) -> str:
    """Build a match key from the failure's full suite + test name path.

    The Cypress screenshot encodes the path as 'Suite -- SubSuite -- TestName'.
    The JUnit name field uses double-spaces: 'Suite  SubSuite  TestName',
    and the class field is the test title (often with ID prefix).
    Replace the last segment with the class to include the ID.
    """
    suite_raw = failure["name"]
    class_name = failure["class"]
    suite_parts = [p.strip() for p in re.split(r"  +", suite_raw) if p.strip()]

    if len(suite_parts) > 1:
        suite_parts[-1] = class_name
    else:
        # No double-space delimiters: derive suite prefix by stripping the
        # test title (class without CNV ID) from the end of the name.
        test_title = re.sub(r"^ID\([^)]*\)\s*", "", class_name).strip()
        if test_title and suite_raw.endswith(test_title):
            prefix = suite_raw[: -len(test_title)].strip()
            suite_parts = [prefix, class_name] if prefix else [class_name]
        else:
            suite_parts = [class_name]

    return _normalize_colon(" -- ".join(suite_parts))


def _normalize_colon(text: str) -> str:
    """Normalize a match key for comparison against Cypress screenshot names.

    Screenshots drop ':' after 'OCPNETUI-NNN' and use ' -- ' as suite
    separator, while JUnit names use plain spaces. Collapse both.
    """
    return re.sub(r"\s*--\s*", " ", text.lower()).replace(":", "").replace("  ", " ").strip()


def match_media_to_failures(
    failures: list[dict], artifact_files: dict[str, Path]
) -> list[Path]:
    """Match screenshots/videos to failures by full test name.

    Returns list of unmatched media files.
    """
    img_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    vid_exts = {".mp4", ".webm", ".mov"}
    media_exts = img_exts | vid_exts

    media_files: dict[str, Path] = {}
    for k, v in artifact_files.items():
        if Path(k).suffix.lower() in media_exts:
            if "/assets/" not in k and "/node_modules/" not in k:
                media_files[k] = v

    matched_paths: set[Path] = set()

    # Pre-compute: full match keys and class-only keys for each failure
    failure_full_keys = [_build_failure_match_key(f) for f in failures]
    failure_class_keys = [_normalize_colon(f["class"]) for f in failures]

    # Pass 1: match screenshots by test name in filename
    for rel_path, abs_path in media_files.items():
        if Path(rel_path).suffix.lower() in vid_exts:
            continue
        screenshot_key = _normalize_colon(_extract_test_path_from_screenshot(Path(rel_path).name))
        if not screenshot_key:
            continue

        best_idx = -1
        best_len = 0

        # Try full path match first (suite chain + class)
        for idx, fkey in enumerate(failure_full_keys):
            if fkey and fkey in screenshot_key and len(fkey) > best_len:
                best_idx = idx
                best_len = len(fkey)

        # Fallback: match by class name (test title) at the end of screenshot path
        if best_idx < 0:
            for idx, ckey in enumerate(failure_class_keys):
                if ckey and screenshot_key.endswith(ckey) and len(ckey) > best_len:
                    best_idx = idx
                    best_len = len(ckey)

        # Hook screenshots: filename ends '... -- before all hook (failed).png'
        # while the JUnit name is '"before all" hook for "test title"'. Match
        # on the hook keyword plus the quoted test title appearing in the name.
        if best_idx < 0:
            m = re.search(r"(before all|before each|after all|after each) hook$", screenshot_key)
            if m:
                hook = m.group(1)
                for idx, failure in enumerate(failures):
                    quoted = re.findall(r'"([^"]+)"', failure["name"])
                    if quoted and quoted[-1] and quoted[-1].lower() in screenshot_key and hook in failure["name"]:
                        best_idx = idx
                        break

        # Last resort: match by CNV ID
        if best_idx < 0:
            file_ids = extract_cnv_ids(Path(rel_path).name)
            if file_ids:
                for idx, failure in enumerate(failures):
                    if failure["cnv_ids"] & file_ids:
                        best_idx = idx
                        break

        if best_idx >= 0:
            failures[best_idx]["screenshots"].append(abs_path)
            matched_paths.add(abs_path)

    # Pass 3: match videos by spec-file directory relationship
    # Videos are named <spec>.cy.ts.mp4, screenshots sit under screenshots/<spec>.cy.ts/
    for failure in failures:
        spec_names: set[str] = set()
        sf = failure.get("spec_file", "")
        if sf:
            spec_names.add(sf)
        for ss in failure["screenshots"]:
            parent = ss.parent.name
            if parent.endswith(".cy.ts"):
                spec_names.add(parent)
        for rel_path, abs_path in media_files.items():
            if abs_path in matched_paths:
                continue
            if Path(rel_path).suffix.lower() not in vid_exts:
                continue
            vid_name = Path(rel_path).stem
            if vid_name in spec_names:
                failure["videos"].append(abs_path)
                matched_paths.add(abs_path)

    unmatched = [p for p in media_files.values() if p not in matched_paths]
    return unmatched


# ---------------------------------------------------------------------------
# Metadata extraction (cluster info, versions, branch, command)
# ---------------------------------------------------------------------------

def extract_build_parameters(build_json: dict) -> dict[str, str]:
    """Pull build parameters from Jenkins actions array."""
    params = {}
    for action in build_json.get("actions", []):
        if not isinstance(action, dict):
            continue
        cls = action.get("_class", "")
        if "ParametersAction" in cls:
            for p in action.get("parameters", []):
                params[p.get("name", "")] = str(p.get("value", ""))
    return params


def extract_reportportal_url(build_json: dict) -> str:
    """Extract ReportPortal launch URL from Jenkins badge actions."""
    for action in build_json.get("actions", []):
        if not isinstance(action, dict):
            continue
        text = action.get("text", "")
        if "reportportal" in text.lower():
            m = re.search(r'href="(https?://[^"]*reportportal[^"]*)"', text)
            if m:
                raw = m.group(1)
                # Strip query params / filter suffixes to get the base launch URL
                base = re.sub(r'/\?.*$', '/', raw)
                # Normalise: .../launches/all/159869/ -> .../launches/all/159869
                return base.rstrip("/")
    return ""


async def fetch_rp_defects(rp_url: str) -> dict:
    """Fetch defect type definitions and per-item defect data from ReportPortal.

    Returns dict with defect_types, items mapping (with item IDs) and api_base.
    The bearer token is used here only and never leaves the server process.
    """
    rp_token = os.environ.get("RP_TOKEN", "")
    if not rp_token or not rp_url:
        return {}

    m = re.search(r"(https?://[^/]+).*?#(\w+)/launches/\w+/(\d+)", rp_url)
    if not m:
        return {}
    host, project, launch_id = m.group(1), m.group(2), m.group(3)
    api_base = f"{host}/api/v1/{project}"

    try:
        async with httpx.AsyncClient(verify=False, timeout=httpx.Timeout(15.0)) as http:
            headers = {"Authorization": f"Bearer {rp_token}"}

            settings = await http.get(f"{api_base}/settings", headers=headers)
            settings.raise_for_status()

            group_labels = {
                "TO_INVESTIGATE": "To Investigate",
                "PRODUCT_BUG": "Product Bug",
                "AUTOMATION_BUG": "Automation Bug",
                "SYSTEM_ISSUE": "System Issue",
                "NO_DEFECT": "No Defect",
            }
            allowed_groups = ["PRODUCT_BUG", "SYSTEM_ISSUE", "AUTOMATION_BUG", "NO_DEFECT"]
            group_order = {g: i for i, g in enumerate(allowed_groups)}
            defect_types: list[dict] = []
            type_map: dict[str, dict] = {}
            for group_key, group in settings.json().get("subTypes", {}).items():
                for t in group:
                    entry = {
                        "locator": t["locator"],
                        "label": t.get("longName", t.get("shortName", "")),
                        "short": t.get("shortName", ""),
                        "color": t.get("color", "#666"),
                        "group": group_labels.get(group_key, group_key),
                    }
                    type_map[t["locator"]] = entry
                if group_key in group_order and group:
                    first = group[0]
                    defect_types.append({
                        "locator": first["locator"],
                        "label": group_labels.get(group_key, group_key),
                        "short": first.get("shortName", ""),
                        "color": first.get("color", "#666"),
                        "_order": group_order[group_key],
                    })
            defect_types.sort(key=lambda d: d.pop("_order", 99))

            items_resp = await http.get(
                f"{api_base}/item",
                params={
                    "filter.eq.launchId": launch_id,
                    "filter.in.status": "FAILED",
                    "page.size": "200",
                },
                headers=headers,
            )
            items_resp.raise_for_status()

            items: dict[str, dict] = {}
            for item in items_resp.json().get("content", []):
                issue = item.get("issue", {})
                issue_type = issue.get("issueType", "")
                defect = type_map.get(issue_type, {
                    "locator": issue_type or "ti001",
                    "label": "To Investigate", "short": "TI", "color": "#00829b",
                })
                item_entry = {
                    "item_id": item.get("id", 0),
                    "issue_type": issue_type or "ti001",
                    "label": defect["label"],
                    "color": defect["color"],
                }
                name = item.get("name", "")
                name_key = name.split(".", 1)[0].strip().lower()
                full_key = name.lower().strip()
                items[name_key] = item_entry
                items[full_key] = item_entry

            return {
                "defect_types": defect_types,
                "items": items,
                "api_base": api_base,
            }
    except Exception as e:
        logger.warning("Could not fetch ReportPortal defects: %s", e)
        return {}


def _flatten_json(data: dict, prefix: str = "") -> dict[str, str]:
    """Flatten a nested dict into dot-free keys like 'cluster_domain'."""
    result: dict[str, str] = {}
    for k, v in data.items():
        key = f"{prefix}_{k}".lower() if prefix else k.lower()
        if isinstance(v, dict):
            result.update(_flatten_json(v, prefix=key))
        elif isinstance(v, str):
            result[key] = v
        else:
            result[key] = str(v)
    return result


def extract_run_metadata(artifacts_dir: Path) -> dict[str, str]:
    """Read run-info.json and build-info.json from extracted artifacts for cluster/version info."""
    meta: dict[str, str] = {}

    for candidate in ["archive/run-info.json", "run-info.json"]:
        path = artifacts_dir / candidate
        if path.is_file():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    meta["_run_info"] = json.dumps(data)
                    meta.update(_flatten_json(data))
            except Exception:
                pass
            break

    for candidate in ["archive/build-info.json", "build-info.json"]:
        path = artifacts_dir / candidate
        if path.is_file():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    meta["_build_info"] = json.dumps(data)
                    for k, v in _flatten_json(data).items():
                        if k not in meta:
                            meta[k] = v
            except Exception:
                pass
            break

    return meta


_META_KEY_MAP = {
    "cluster_name": ["cluster_cluster", "cluster_name", "clustername"],
    "cluster_domain": ["cluster_domain", "cluster_domain"],
    "cluster_id": ["cluster_clusterid", "cluster_id", "clusterid"],
    "deploy_url": ["cluster_buildurl"],
    "ocp_version": ["cnv_ocpversion", "ocp_version", "ocpversion", "openshiftversion", "openshift_version"],
    "cnv_version": ["cnv_cnvversion", "cnv_version", "cnvversion", "cnv", "kubevirt_version", "hco_version"],
    "cnv_bundle_version": ["cnv_hcobundleversion", "bundleversion", "hco_bundle_version"],
    "branch": ["branch", "git_branch", "gitbranch", "test_branch", "repo_branch",
               "git_console_repo_branch"],
    "command": ["command", "cmd", "entry_command", "run_command", "test_command", "entrycommand"],
    "git_repo_url": ["git_console_repo_url", "git_repo_url", "repo_url"],
    "git_repo_branch": ["git_console_repo_branch", "git_repo_branch", "repo_branch"],
}


def resolve_metadata(
    run_meta: dict[str, str], build_params: dict[str, str]
) -> dict[str, str]:
    """Resolve cluster/version/branch/command from all available sources."""
    combined: dict[str, str] = {}
    for k, v in build_params.items():
        combined[k.lower()] = v
    for k, v in run_meta.items():
        if not k.startswith("_"):
            combined[k] = v

    result: dict[str, str] = {}
    for field_name, candidates in _META_KEY_MAP.items():
        for c in candidates:
            val = combined.get(c, "").strip()
            if val:
                result[field_name] = val
                break

    # Compute OpenShift console URL from cluster_name + cluster_domain
    cname = result.get("cluster_name", "")
    domain = result.get("cluster_domain", "")
    if cname and domain:
        result["console_url"] = f"https://console-openshift-console.apps.{cname}.{domain}"

    # Normalize git repo URL (strip trailing .git for display links)
    repo = result.get("git_repo_url", "")
    if repo:
        result["git_repo_display_url"] = repo.removesuffix(".git")

    return result


# ---------------------------------------------------------------------------
# Allure results parsing (Playwright)
# ---------------------------------------------------------------------------

def _find_allure_dir(out_dir: Path) -> Path | None:
    """Return the allure-results directory inside extracted artifacts, or None."""
    for candidate in out_dir.rglob("allure-results"):
        if candidate.is_dir() and any(candidate.glob("*-result.json")):
            return candidate
    return None


def _collect_step_attachments(node: dict, png_sources: list[str]) -> None:
    """Recursively walk Allure step/attachment tree and collect PNG sources."""
    for att in node.get("attachments", []):
        if att.get("source", "").endswith(".png"):
            png_sources.append(att["source"])
    for step in node.get("steps", []):
        _collect_step_attachments(step, png_sources)


def parse_allure_failures(allure_dir: Path) -> list[dict]:
    """Parse Playwright Allure results into the standard failure-dict format.

    Groups retried tests (same suite + name) and merges their screenshots.
    Returns one dict per unique failed test, sorted by first start time.
    """
    from collections import defaultdict

    # Parse every *-result.json and collect failed test data
    raw: list[dict] = []
    for result_file in allure_dir.glob("*-result.json"):
        try:
            data = json.loads(result_file.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            continue
        if data.get("status") != "failed":
            continue

        labels = {lbl["name"]: lbl["value"] for lbl in data.get("labels", [])
                  if "name" in lbl and "value" in lbl}
        suite = labels.get("suite", "")
        sub_suite = labels.get("subSuite", "")
        parent_suite = labels.get("parentSuite", "")

        # Collect all PNG attachment sources recursively from steps
        png_sources: list[str] = []
        _collect_step_attachments(data, png_sources)
        # Also top-level attachments
        for att in data.get("attachments", []):
            if att.get("source", "").endswith(".png"):
                png_sources.append(att["source"])

        sd = data.get("statusDetails") or {}
        raw.append({
            "_key": (suite, data.get("name", "")),
            "_start": data.get("start", 0),
            "class": data.get("name", ""),
            "name": " > ".join(p for p in [parent_suite, suite, sub_suite] if p),
            "status": "FAILED",
            "error_message": sd.get("message", ""),
            "stack_trace": sd.get("trace", ""),
            "duration": (data.get("stop", 0) - data.get("start", 0)) / 1000,
            "stdout": "",
            "stderr": "",
            "cnv_ids": extract_cnv_ids(data.get("name", "")),
            "spec_file": suite,      # e.g. "tier2/networking/net-nad.spec.ts"
            "suite_timestamp": "",
            "exec_order": 0,
            "screenshots": [],
            "videos": [],
            "_png_sources": png_sources,
            "_retries": 1,
        })

    # Group by (suite, name) – merge retries, keeping last run's message/trace
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for entry in raw:
        groups[entry["_key"]].append(entry)

    merged: list[dict] = []
    for key, items in groups.items():
        items.sort(key=lambda x: x["_start"])
        base = items[-1].copy()          # last attempt carries the final error
        base["_retries"] = len(items)
        # Merge unique PNG sources across all attempts
        seen: set[str] = set()
        all_pngs: list[str] = []
        for it in items:
            for src in it["_png_sources"]:
                if src not in seen:
                    seen.add(src)
                    all_pngs.append(src)
        # Resolve to Path objects (only those that exist)
        base["screenshots"] = [
            allure_dir / src for src in all_pngs
            if (allure_dir / src).exists()
        ]
        base["_start"] = items[0]["_start"]
        merged.append(base)

    merged.sort(key=lambda x: x["_start"])
    for i, entry in enumerate(merged):
        entry["exec_order"] = i

    # --- Fallback: match screenshots from allure-results per-test subdirectories ---
    # Playwright's allure reporter writes failure screenshots to named subdirs
    # (e.g. "tier2-networking-...-create-L2-overlay-...-E2E-Tests/failure-screenshot.png")
    # that are NOT referenced in the result JSON attachments.  Match by slugified word overlap.
    _subdir_screenshots = _collect_subdir_screenshots(allure_dir)
    if _subdir_screenshots:
        for entry in merged:
            if entry["screenshots"]:
                continue  # already have screenshots from JSON attachments
            best = _best_subdir_match(entry["class"], _subdir_screenshots)
            if best:
                entry["screenshots"] = best

    return merged


def _slug_words(text: str) -> list[str]:
    """Lower-case alphanumeric tokens >= 3 chars from ``text``."""
    import re
    clean = re.sub(r"ID\(CNV-\d+\)\s*", "", text, flags=re.IGNORECASE)
    return [w for w in re.sub(r"[^a-z0-9]+", "-", clean.lower()).split("-") if len(w) >= 3]


def _collect_subdir_screenshots(allure_dir: Path) -> dict[str, list[Path]]:
    """Map subdir name → list of PNG paths for every named subdir under allure_dir."""
    result: dict[str, list[Path]] = {}
    try:
        for entry in allure_dir.iterdir():
            if not entry.is_dir():
                continue
            pngs = list(entry.glob("*.png")) + list((entry / "attachments").glob("*.png") if (entry / "attachments").is_dir() else [])
            if pngs:
                result[entry.name] = pngs
    except Exception:
        pass
    return result


def _best_subdir_match(test_name: str, subdir_screenshots: dict[str, list[Path]]) -> list[Path]:
    """Return screenshots from the subdir whose name best matches ``test_name`` by word overlap."""
    words = _slug_words(test_name)
    if not words:
        return []
    best_score, best_paths = 0, []
    for sd_name, paths in subdir_screenshots.items():
        sd_lower = sd_name.lower()
        score = sum(1 for w in words if w in sd_lower)
        if score > best_score:
            best_score, best_paths = score, paths
    return best_paths if best_score >= 2 else []


# ---------------------------------------------------------------------------
# Allure report remote data fetching (Jenkins-side processed report)
# ---------------------------------------------------------------------------

def _collect_step_attachments_processed(node: dict, sources: list[str]) -> None:
    """Recursively collect attachment sources from a processed Allure test-case JSON (steps)."""
    for att in node.get("attachments", []):
        src = att.get("source", "")
        if src.endswith(".png"):
            sources.append(src)
    for step in node.get("steps", []):
        _collect_step_attachments_processed(step, sources)


async def fetch_allure_report_failures(
    client: "JenkinsClient",
    build_url: str,
    out_dir: Path,
) -> list[dict] | None:
    """Build the canonical failures list from the Jenkins-processed Allure report.

    Uses ``Allure_20Report/data/suites.json`` (authoritative final status) and
    ``Allure_20Report/data/test-cases/<uid>.json`` for full metadata + attachments.
    Downloads screenshots from ``Allure_20Report/data/attachments/``.

    Returns a list of failure dicts in the standard format, or ``None`` if the
    Allure report endpoint is not accessible (caller should fall back to raw parsing).
    """
    allure_base = build_url.rstrip("/") + "/Allure_20Report"
    att_dir = out_dir / "allure-report-attachments"
    att_dir.mkdir(parents=True, exist_ok=True)

    # 1. Fetch suites.json — authoritative list of final test statuses
    try:
        resp = await client.http.get(f"{allure_base}/data/suites.json")
        resp.raise_for_status()
        suites = resp.json()
    except Exception as exc:
        logger.warning("Could not fetch Allure suites.json: %s", exc)
        return None

    def _traverse_suites(node: dict, result: list[dict]) -> None:
        if "uid" in node and "status" in node:
            result.append(node)
        for child in node.get("children", []):
            _traverse_suites(child, result)

    all_tests: list[dict] = []
    _traverse_suites(suites, all_tests)
    failed_tests = [t for t in all_tests if t.get("status") == "failed"]

    if not failed_tests:
        logger.info("Allure suites.json: no failed tests")
        return []

    # 2. For each failed UID, fetch test-case JSON for full metadata + attachments
    failures: list[dict] = []
    for idx, test in enumerate(failed_tests):
        uid = test.get("uid", "")
        name = test.get("name", "")
        if not uid:
            continue
        try:
            tc_resp = await client.http.get(f"{allure_base}/data/test-cases/{uid}.json")
            tc_resp.raise_for_status()
            tc = tc_resp.json()
        except Exception as exc:
            logger.warning("Could not fetch test-case %s (%s): %s", uid, name, exc)
            continue

        # Extract labels
        labels = {lbl["name"]: lbl["value"] for lbl in tc.get("labels", [])
                  if "name" in lbl and "value" in lbl}
        suite = labels.get("suite", "")
        sub_suite = labels.get("subSuite", "")
        parent_suite = labels.get("parentSuite", "")

        # Error message / stack trace
        error_msg = tc.get("statusMessage", "")
        stack_trace = tc.get("statusTrace", "")

        # Duration
        t = tc.get("time", {})
        duration = (t.get("stop", 0) - t.get("start", 0)) / 1000

        # Collect all PNG attachment sources from all stages/steps
        sources: list[str] = []
        for stage_key in ("beforeStages", "afterStages"):
            for stage in tc.get(stage_key, []):
                _collect_step_attachments_processed(stage, sources)
        if "testStage" in tc:
            _collect_step_attachments_processed(tc["testStage"], sources)

        # 3. Download each attachment file
        screenshot_paths: list[Path] = []
        seen: set[str] = set()
        for src in sources:
            if src in seen:
                continue
            seen.add(src)
            dest = att_dir / src
            if not dest.exists():
                try:
                    img_resp = await client.http.get(f"{allure_base}/data/attachments/{src}")
                    img_resp.raise_for_status()
                    dest.write_bytes(img_resp.content)
                    logger.info("Downloaded allure attachment %s", src)
                except Exception as exc:
                    logger.warning("Could not download attachment %s: %s", src, exc)
                    continue
            screenshot_paths.append(dest)

        failures.append({
            "class": name,
            "name": " > ".join(p for p in [parent_suite, suite, sub_suite] if p),
            "status": "FAILED",
            "error_message": error_msg,
            "stack_trace": stack_trace,
            "duration": duration,
            "stdout": "",
            "stderr": "",
            "cnv_ids": extract_cnv_ids(name),
            "spec_file": suite,
            "suite_timestamp": "",
            "exec_order": idx,
            "screenshots": screenshot_paths,
            "videos": [],
            "_retries": tc.get("retriesCount", 0),
        })

    logger.info(
        "Allure report: built %d failures with screenshots",
        len(failures),
    )
    return failures


# ---------------------------------------------------------------------------
# RootCoz integration
# ---------------------------------------------------------------------------

_ROOTCOZ_CLASS_COLORS = {
    "CODE ISSUE": "#ff9800",
    "PRODUCT BUG": "#f44336",
    "INFRASTRUCTURE": "#7e57c2",
}

_ROOTCOZ_ICON_SVG = (
    "data:image/svg+xml;base64,"
    "PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI2IiBmaWxsPSIjZjA4ODNlIiBmaWxsLW9wYWNpdHk9IjAuMTgiLz48dGV4dCB4PSIxNiIgeT0iMjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJ1aS1tb25vc3BhY2UsbW9ub3NwYWNlIiBmb250LXNpemU9IjExIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjZjA4ODNlIj5SQzwvdGV4dD48L3N2Zz4="
)


def _normalize_build_url(url: str) -> str:
    return url.rstrip("/")


async def fetch_rootcoz_analysis(build_url: str) -> dict | None:
    """Look up a completed RootCoz analysis for a Jenkins build URL."""
    base_url = os.environ.get("ROOTCOZ_URL", "").rstrip("/")
    api_key = os.environ.get("ROOTCOZ_API_KEY", "")
    if not base_url or not api_key:
        logger.info("RootCoz not configured (ROOTCOZ_URL / ROOTCOZ_API_KEY missing)")
        return None

    verify = os.environ.get("ROOTCOZ_VERIFY_SSL", "false").lower() == "true"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    target = _normalize_build_url(build_url)

    async with httpx.AsyncClient(
        headers=headers,
        timeout=httpx.Timeout(30.0, read=120.0),
        follow_redirects=True,
        verify=verify,
    ) as http:
        resp = await http.get(f"{base_url}/results", params={"limit": 100})
        if resp.status_code != 200:
            logger.warning("RootCoz list failed: HTTP %s", resp.status_code)
            return None

        job_id = None
        status = None
        for item in resp.json():
            item_url = _normalize_build_url(item.get("build_url") or item.get("jenkins_url") or "")
            if item_url == target:
                job_id = item.get("job_id")
                status = item.get("status")
                break

        if not job_id:
            logger.info("No RootCoz analysis found for %s", build_url)
            return None

        detail_resp = await http.get(f"{base_url}/results/{job_id}")
        if detail_resp.status_code not in (200, 202):
            logger.warning("RootCoz get_results failed: HTTP %s", detail_resp.status_code)
            return None

        data = detail_resp.json()
        data["_rootcoz_base_url"] = base_url
        if not data.get("result_url") and job_id:
            data["result_url"] = f"{base_url}/results/{job_id}"
        if status == "running" or data.get("status") == "running":
            data["_rootcoz_pending"] = True
        return data


def _rootcoz_header_url(rootcoz_data: dict | None) -> str:
    """URL for the header RootCoz button (specific result or RootCoz home)."""
    if rootcoz_data:
        url = (rootcoz_data.get("result_url") or "").strip()
        if url:
            return url
        job_id = rootcoz_data.get("job_id", "")
        base = (
            rootcoz_data.get("_rootcoz_base_url")
            or rootcoz_data.get("base_url")
            or os.environ.get("ROOTCOZ_URL", "")
        ).rstrip("/")
        if job_id and base:
            return f"{base}/results/{job_id}"
    return os.environ.get("ROOTCOZ_URL", "").rstrip("/")


def _rootcoz_summary_preview(text: str, limit: int = 160) -> str:
    one_line = " ".join(text.split())
    if len(one_line) <= limit:
        return one_line
    return one_line[: limit - 1] + "…"


def _render_rc_key_takeaway_card(body_html: str) -> str:
    """RootCoz Key Takeaway callout — matches ReportPage.tsx styling."""
    return f"""
        <div class="rc-key-takeaway-card">
            <h2 class="rc-key-takeaway-heading">Key Takeaway</h2>
            <div class="rc-key-takeaway-body">{body_html}</div>
        </div>"""


def _render_rootcoz_empty(message: str = "No analysis found.") -> str:
    return f"""
    <section class="rootcoz-section">
        {_render_rc_key_takeaway_card(_esc(message))}
    </section>"""


def _render_rootcoz_toolbar(result_url: str) -> str:
    if not result_url:
        return ""
    return (
        f'<div class="rootcoz-toolbar">'
        f'<a class="rootcoz-link" href="{_esc(result_url)}" target="_blank" '
        f'title="Open in RootCoz">Open in RootCoz ↗</a></div>'
    )


def _render_rootcoz_peer_round(round_data: dict) -> str:
    classification = round_data.get("classification", "")
    color = _ROOTCOZ_CLASS_COLORS.get(classification, "#666")
    role = round_data.get("role", "peer")
    provider = round_data.get("ai_provider", "")
    model = round_data.get("ai_model", "")
    agrees = round_data.get("agrees_with_orchestrator")
    agree_label = ""
    if agrees is True:
        agree_label = '<span class="peer-agree yes">Agrees</span>'
    elif agrees is False:
        agree_label = '<span class="peer-agree no">Disagrees</span>'
    details = round_data.get("details", "")
    round_num = round_data.get("round", "?")
    summary = (
        f'Round {round_num} · {role.title()} · {provider}/{model} · '
        f'<span class="rc-class-badge" style="background:{color}">{_esc(classification)}</span>'
        f'{agree_label}'
    )
    return f"""
        <details class="rc-peer-round">
            <summary><span class="clickable">{summary}</span></summary>
            <div class="rc-peer-round-body">{_esc(details)}</div>
        </details>"""


def _render_rootcoz_cards(rootcoz_data: dict | None) -> str:
    if not rootcoz_data:
        return _render_rootcoz_empty()

    result_url = rootcoz_data.get("result_url", "")
    toolbar = _render_rootcoz_toolbar(result_url)

    if rootcoz_data.get("_rootcoz_pending"):
        link = f' <a class="rootcoz-link" href="{_esc(result_url)}" target="_blank">View in RootCoz</a>' if result_url else ""
        return f"""
    <section class="rootcoz-section">
        {toolbar}
        {_render_rc_key_takeaway_card(_esc("Analysis is still in progress.") + link)}
    </section>"""

    result = rootcoz_data.get("result") or {}
    failure_groups = result.get("failures") or []
    summary = (result.get("summary") or "").strip()

    if not failure_groups and not summary:
        return _render_rootcoz_empty()

    parts: list[str] = [f'<section class="rootcoz-section">', toolbar]
    if summary:
        parts.append(_render_rc_key_takeaway_card(_esc(summary)))

    for idx, group in enumerate(failure_groups, 1):
        analysis = group.get("analysis") or {}
        classification = analysis.get("classification", "UNKNOWN")
        color = _ROOTCOZ_CLASS_COLORS.get(classification, "#666")
        test_name = group.get("test_name", f"Failure group {idx}")
        details = (analysis.get("details") or "").strip()
        preview = _rootcoz_summary_preview(details or test_name)
        peer = group.get("peer_debate") or {}
        rounds = peer.get("rounds") or []
        consensus = peer.get("consensus_reached")
        rounds_used = peer.get("rounds_used", len(rounds))
        max_rounds = peer.get("max_rounds", rounds_used)
        consensus_label = "Consensus" if consensus else "No Consensus" if consensus is False else "Unknown"
        consensus_class = "yes" if consensus else "no" if consensus is False else "unknown"

        peer_html = "".join(_render_rootcoz_peer_round(r) for r in rounds)
        peer_section = ""
        if peer_html:
            peer_section = f"""
            <div class="rc-peer-analysis">
                <div class="rc-peer-analysis-header">
                    <span class="rc-peer-analysis-title">Peer Analysis</span>
                    <span class="rc-peer-consensus {consensus_class}">{consensus_label}</span>
                    <span class="rc-peer-meta">{rounds_used}/{max_rounds} rounds</span>
                </div>
                {peer_html}
            </div>"""

        code_fix = analysis.get("code_fix") or {}
        code_fix_html = ""
        if code_fix.get("change") or code_fix.get("suggested_code"):
            fix_parts = []
            if code_fix.get("file"):
                line = code_fix.get("line", "")
                fix_parts.append(
                    f'<p class="code-fix-meta"><code>{_esc(str(code_fix.get("file")))}:{_esc(str(line))}</code></p>'
                )
            if code_fix.get("change"):
                fix_parts.append(f'<p class="code-fix-desc">{_esc(code_fix["change"])}</p>')
            if code_fix.get("suggested_code"):
                fix_parts.append(
                    f'<details class="stack-trace"><summary>Suggested code</summary>'
                    f'<pre><code>{_esc(code_fix["suggested_code"])}</code></pre></details>'
                )
            code_fix_html = f'<div class="code-fix-block">{"".join(fix_parts)}</div>'

        takeaway_body = _render_rc_key_takeaway_card(_esc(details)) if details else ""
        parts.append(f"""
        <details class="rc-failure-group">
            <summary>
                <span class="clickable">
                    <span class="rc-class-badge" style="background:{color}">{_esc(classification)}</span>
                    <span class="rc-failure-name">{_esc(test_name)}</span>
                </span>
                <br><small class="rc-failure-preview">{_esc(preview)}</small>
            </summary>
            <div class="rc-failure-body">
                {takeaway_body}
                {peer_section}
                {code_fix_html}
            </div>
        </details>""")

    parts.append("</section>")
    return "".join(parts)

_last_open: tuple[str, float] | None = None


def _open_report_in_browser(report_path: Path) -> bool:
    """Open the HTML report in the default browser (deduplicated)."""
    global _last_open
    resolved = report_path.resolve()
    now = __import__('time').time()
    # Deduplicate: if the same report was opened within 10s (e.g. two MCP
    # servers handling the same request or client+server both opening), skip.
    if _last_open and _last_open[0] == str(resolved) and now - _last_open[1] < 10:
        logger.info("Skipping duplicate browser open for %s", resolved)
        return True
    _last_open = (str(resolved), now)
    try:
        if sys.platform == "darwin":
            subprocess.run(["open", str(resolved)], check=True)
            return True
        return webbrowser.open(resolved.as_uri())
    except Exception as e:
        logger.warning("Could not open report in browser: %s", e)
        return False

# Console / Cypress signals that tests never executed (skip auto-open).
_TESTS_DID_NOT_RUN_MARKERS = (
    "Tests were not running properly - No Results",
    "Can't run because no spec files were found",
    "spec-not-found",
    "No specs found",
    "Can't run because no spec files were found.",
)


def _tests_did_not_run(
    test_counts: dict,
    failures: list,
    *,
    test_report_available: bool = True,
    console_text: str = "",
) -> tuple[bool, str]:
    """Return (did_not_run, reason) when Cypress/tests produced no real results.

    Used to skip auto-opening failure-report.html while still saving the report.
    """
    total = int(test_counts.get("total") or 0)
    if total == 0 and not failures:
        return True, "0 total tests / no results"
    if not test_report_available and not failures:
        return True, "empty or missing test report"
    if console_text:
        lower = console_text.lower()
        for marker in _TESTS_DID_NOT_RUN_MARKERS:
            if marker.lower() in lower:
                return True, marker
    return False, ""


# ---------------------------------------------------------------------------
# HTML report generation
# ---------------------------------------------------------------------------

def _esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def file_to_data_uri(file_path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(file_path))
    if not mime:
        mime = "application/octet-stream"
    data = file_path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _match_rp_defect(failure: dict, rp_items: dict[str, dict]) -> dict | None:
    """Find the ReportPortal defect info (including item_id) for a failure."""
    if not rp_items:
        return None
    class_key = failure["class"].lower().strip()
    if class_key in rp_items:
        return rp_items[class_key]
    for rp_key, defect in rp_items.items():
        if class_key in rp_key or rp_key.endswith(class_key):
            return defect
    return None


def _video_relative_path(video_path: Path, out_dir: Path) -> str:
    """Return a relative path from the report HTML to the video file."""
    try:
        return str(video_path.relative_to(out_dir))
    except ValueError:
        return str(video_path)


def _assert_no_embedded_secrets(html: str) -> None:
    """Refuse to write a report that contains a live credential.

    The report is a shareable artifact, so the kubeadmin password is never
    fetched and the ReportPortal token stays inside this process. This guard
    fails loudly if a templating change ever reintroduces one of them.
    """
    for name in ("RP_TOKEN", "BRIDGE_KUBEADMIN_PASSWORD"):
        value = os.environ.get(name, "")
        if len(value) >= 6 and value in html:
            raise RuntimeError(f"Refusing to write report: {name} value found in generated HTML")


def generate_html_report(
    build_info: dict,
    failures: list[dict],
    unmatched_media: list[Path],
    metadata: dict[str, str],
    test_counts: dict[str, int],
    reportportal_url: str = "",
    rp_data: dict | None = None,
    out_dir: Path | None = None,
    rootcoz_data: dict | None = None,
) -> str:
    rp_items = rp_data.get("items", {}) if rp_data else {}
    defect_types = rp_data.get("defect_types", []) if rp_data else []
    defect_types_json = json.dumps(defect_types) if defect_types else "[]"
    # Non-secret: the launch URL is only used to build the copyable agent command.
    rp_launch_url = _esc(reportportal_url)

    job_name = build_info.get("fullDisplayName", "Unknown Build")
    job_name = re.sub(r'^test-kubevirt-console-', '', job_name)
    _cmd = metadata.get("command", "").lower()
    if "playwright" in _cmd:
        fw_badge = ' <span class="fw-badge pw">PW</span>'
    elif "cypress" in _cmd:
        fw_badge = ' <span class="fw-badge cy">CY</span>'
    else:
        fw_badge = ""
    build_url = build_info.get("url", "")
    result = build_info.get("result", "UNKNOWN")
    duration_ms = build_info.get("duration", 0)
    timestamp_ms = build_info.get("timestamp", 0)

    duration_m = duration_ms / 60000
    if timestamp_ms:
        _utc_dt = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
        _ist_dt = _utc_dt.astimezone(timezone(timedelta(hours=5, minutes=30)))
        run_dt_utc = _utc_dt.strftime("%d %B, %H:%M UTC")
        run_dt_ist = _ist_dt.strftime("%H:%M IST")
        run_dt = f"{run_dt_utc} / {run_dt_ist}"
    else:
        run_dt = "N/A"

    result_color = {
        "SUCCESS": "#4caf50", "FAILURE": "#f44336",
        "UNSTABLE": "#ff9800", "ABORTED": "#9e9e9e",
    }.get(result, "#9e9e9e")

    total = test_counts.get("total", 0)
    failed = test_counts.get("failed", 0)
    skipped = test_counts.get("skipped", 0)
    passed = total - failed - skipped

    # --- metadata rows for header ---
    meta_rows = ""

    # Row 1: Cluster icon + cluster + versions + repo (never credentials)
    _icon_style = 'vertical-align: -5px; margin-right: 0.4rem; opacity: 0.7;'
    _cluster_icon = f'<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFcElEQVR42u1XQWjd2BU9970nWfqR9f0xCRNsAq6R3eymJRRKGcjvpjOLMtBFFt2VQjeFJpvMpuuBkjIMhW66KN11iqHQySq7n00pFNJm6ID5/8t1jLOK7fzYkizp6713u6j+VHH0sdOku76NhO599x493XvOFWH+IrzdxRf3ZH7byf8nMd/KojMoBRHZ4XD4ru/7v5tOpwTAvGEO6bou53n+o83NzcezHDOjagPkOM61MAzfTZIE3W4XRP/GObsy80WPHcfHxwjDEFrrawAen31p1bbRWlsVRWHLskyfPXv2MTOfEpEgIlMHlnw+CiaiDoCf53keWGurNic199ykFMw8jaLo3puc/3g8viulFPPs6rwaieP4yv7+/vOVlZUNpdQfAaCqqh8kSRJ7nkcHBwf27KbFxUVKkoSvXr26dF47nwcAvu/bfr+vx+Pxd1dXV78OAE+ePOnfuHFjezAYqH6/r9tajoh4d3dXa63xRgCyLKPBYKCY+U/7+/vfBwDP8z5nZvXo0SMaDAavxKifc1mWSkr5RgB4Y2PjoL5/CuB7r1kCh+PxmP8rAMYYQ0QLcRz/GkABQDQYbRZ0VlyWiLiFej0AC8YY81oAmNkNgkAy8+LS0tJPZ/1/BiBOT08BAJ1OB21Hzcx48eIFgiBAkiTuRQAwAAghtp8/f36/qiqVZZluISsG0COibwPA8fHxXwBMGrb/OBOpqqq0EGK7TZRoDj2fS3Wj0egbCwsLfwOAsiy/ubGx8fcLUv9LscXryuZM1YjIa7yld0HF43M1f3d31xNC+NZaTpLkFbtSSmitre/733Jd9wEATKfT9/M8/+vM1kJMLIQga22+trZWtNYAMysi0lVV3VleXv5oMpnoTqdDZymfiOA4DgCoqvqK3v/g+75u2F7yN8ZwGIbq6OjoHoBfzHK1dgERdZRSPSJCr9d7KVBTCbXWODk5AQB0u90lpdRcxZxMJlBKoRanuV1AzEzj8dhYa9kYczCZTO4ZY7QQghtKKYQQlpm/ppS6XXfBr4jonzNbw5eklMoY85G19jIzm7pOqA2AJiKO49g4jkNCiBfr6+ufzKum4XB4XQhxu070m83Nze15vnEc/8RxnCtCCENEzMz6FQCHh4fB3t6eqqqqY4wBM7uj0Wi10+nkKysrycOHDy0AXL582XNd12fmtUaOtdFodDidTvODg4MCAG7evCmGw2EohPCY2a3JsLO3t9c7PDzUABIAoK2tLXnr1i0zHo9/H4bh+0mSKACX6lEsY2ajtf7O9evXhwCws7Pz48XFxV/W3z+sAZyEYYgkSe6ur6//FgC2t7c3lVJ/JiJZx5PMfBqGYXVycvIgiqIfbm1tyeYnWJZS9qSUWFhYADOLqqqWmBlCCLdBwaHjOD0hBHzfBwDked5zHAfGmBkguK7rCiGWZ51BRCjLMqgpe/kVIiKiwnVdNsZ8nmXZB3me36mqirXW3By/pJRTImJr7U6aph+mafqhtXaHiFhKOW20NWutuaoqLsvydpZlH1RVdd91XSaiog0Ae55HRPRFFEUP0jT9jOrVQkbEzEdRFN2Poug+gCOlFLW0NBERaa0/i6LoARF9UefgNiKi09NTy8zvxXH8M2ZeZWZbD5cvBZ5OpxbAO3Ec36n3vlM/O0vbpsZxN47jp9ba9+oc1AYgICIRBEH/0qVLfWst0jQFM6MsS9Hobc91XeH7/rVut/tpzQNwXRfW2qY+CM/zJBEhCIK7QghkWQYiAjMHbTzwZZ7nV9I0naZpCiKCtdYBYKy1acPvaZZl/yiKoiqKojm6OVLK/a9IRevUWvsYgCyKomqUkQvgS/x/zfk3bCv6Nh2nC+o9tY1pzfnxX958Ac7nFfbKAAAAAElFTkSuQmCC" alt="" width="24" height="24" style="{_icon_style}">'
    row1_parts: list[str] = []
    console_url = metadata.get("console_url", "")
    cluster_display = metadata.get("cluster_name") or metadata.get("cluster_id", "")
    if console_url and cluster_display:
        row1_parts.append(f'{_cluster_icon}<a class="cluster-link" href="{_esc(console_url)}" target="_blank">{_esc(cluster_display)}</a>')
    elif cluster_display:
        row1_parts.append(f'{_cluster_icon}<span class="cluster-link">{_esc(cluster_display)}</span>')

    version_parts: list[str] = []
    if metadata.get("ocp_version"):
        version_parts.append(f'OCP {_esc(metadata["ocp_version"])}')
    bundle_ver = metadata.get("cnv_bundle_version", "")
    cnv_ver = metadata.get("cnv_version", "")
    if bundle_ver:
        explorer_url = f"https://cnv-version-explorer.apps.cnv2.engineering.redhat.com/BundleDetails?ver={bundle_ver}"
        version_parts.append(f'CNV <a href="{_esc(explorer_url)}" target="_blank">{_esc(bundle_ver)}</a>')
    elif cnv_ver:
        version_parts.append(f'CNV {_esc(cnv_ver)}')
    if version_parts:
        row1_parts.append(f'<span class="sep">|</span> {" &nbsp;/&nbsp; ".join(version_parts)}')

    _repo_icon = f'<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZGNkZGRjIj48cGF0aCBkPSJNOCAwQzMuNTggMCAwIDMuNTggMCA4YzAgMy41NCAyLjI5IDYuNTMgNS40NyA3LjU5LjQuMDcuNTUtLjE3LjU1LS4zOCAwLS4xOS0uMDEtLjgyLS4wMS0xLjQ5LTIuMDEuMzctMi41My0uNDktMi42OS0uOTQtLjA5LS4yMy0uNDgtLjk0LS44Mi0xLjEzLS4yOC0uMTUtLjY4LS41Mi0uMDEtLjUzLjYzLS4wMSAxLjA4LjU4IDEuMjMuODIuNzIgMS4yMSAxLjg3Ljg3IDIuMzMuNjYuMDctLjUyLjI4LS44Ny41MS0xLjA3LTEuNzgtLjItMy42NC0uODktMy42NC0zLjk1IDAtLjg3LjMxLTEuNTkuODItMi4xNS0uMDgtLjItLjM2LTEuMDIuMDgtMi4xMiAwIDAgLjY3LS4yMSAyLjIuODIuNjQtLjE4IDEuMzItLjI3IDItLjI3LjY4IDAgMS4zNi4wOSAyIC4yNyAxLjUzLTEuMDQgMi4yLS44MiAyLjItLjgyLjQ0IDEuMS4xNiAxLjkyLjA4IDIuMTIuNTEuNTYuODIgMS4yNy44MiAyLjE1IDAgMy4wNy0xLjg3IDMuNzUtMy42NSAzLjk1LjI5LjI1LjU0LjczLjU0IDEuNDggMCAxLjA3LS4wMSAxLjkzLS4wMSAyLjIgMCAuMjEuMTUuNDYuNTUuMzhBOC4wMSA4LjAxIDAgMCAwIDE2IDhjMC00LjQyLTMuNTgtOC04LThaIi8+PC9zdmc+" alt="" width="24" height="24" style="{_icon_style}">'
    repo_branch = metadata.get("git_repo_branch", "") or metadata.get("branch", "")
    repo_display = metadata.get("git_repo_display_url", "")
    if repo_display:
        # owner/repo label, e.g. lkladnit/networking-console-plugin:main
        repo_label = "/".join(repo_display.rstrip("/").split("/")[-2:])
        tree_url = repo_display.rstrip("/")
        if repo_branch:
            tree_url = f"{tree_url}/tree/{repo_branch}"
            repo_label = f"{repo_label}:{repo_branch}"
        row1_parts.append(
            f'<span class="sep">|</span> {_repo_icon}'
            f'<a href="{_esc(tree_url)}" target="_blank">{_esc(repo_label)}</a>'
        )
    if row1_parts:
        meta_rows += f'<tr><td>{"".join(row1_parts)}</td></tr>'

    # Row 2: Command icon + command + repo link + duration + timestamp
    _cmd_icon = f'<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABxElEQVR42u2Xv2pUURCHv9/NTVCRVL6BbVAI+OcVAuKD+AKCIIJpRC0sJOsr+AYiCBYWYmchprIV21goye79LHYuLMuuEsnNNnuaew8HznxnZs7vzEQ9BjZZzTiJKnAAfCyQbmCjDXAC3Abu4XTsnffR1T3Vtubb9b8BTAa23dvYBugBuiRj1SSTgU9ukona9fFY6VgDrAHWAGuAZolaRW1WBpDEJN15QMwbaOr0I/VJQbRqzgugN/QNuK8+TDIGNoaCaOfm3TQCeab+BEYqSfbLE5MkDgnQx75N8mpaLDGavqB5rJ55vdAuScKxulkQAQ7qHd9XmyTdoAAFcaJuJRnVbXip/kryXN04q8Kl+Uvl0iQ5Vi8Dd4HvwIfyiIN6oHezehF4C1wDbiX5MngIKuF64++AHeBGkq/qBWC8RKD+q55sF4TEcvubMn4zyWHlxe+hdaCP72tgF9hNcljX7yrwqNZnRWlS+3xK8uK0IVqkA6pPgQfl9q1KxkvA9QWdU1f7/JhT01MBNNWYpETofeXDFjCptc9Jdv5R87ez32WNSd2kZhbgqDR/XguOT3OaRXssGOOCPJoFuKNeWUFzSlbdnv8BdvIWfkRVtvUAAAAASUVORK5CYII=" alt="" width="24" height="24" style="{_icon_style}">'
    row2_parts: list[str] = []
    if metadata.get("command"):
        row2_parts.append(f'{_cmd_icon}<span class="mono">{_esc(metadata["command"])}</span>')
    _timer_icon = f'<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGNkY2RjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iOCIvPjxsaW5lIHgxPSIxMiIgeTE9IjkiIHgyPSIxMiIgeTI9IjEzIi8+PGxpbmUgeDE9IjE0LjUiIHkxPSIxMyIgeDI9IjEyIiB5Mj0iMTMiLz48bGluZSB4MT0iMTAiIHkxPSIxIiB4Mj0iMTQiIHkyPSIxIi8+PGxpbmUgeDE9IjEyIiB5MT0iMSIgeDI9IjEyIiB5Mj0iNSIvPjwvc3ZnPg==" alt="" width="24" height="24" style="{_icon_style}">'
    _cal_icon = f'<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGNkY2RjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48bGluZSB4MT0iMTYiIHkxPSIyIiB4Mj0iMTYiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIyIiB4Mj0iOCIgeTI9IjYiLz48bGluZSB4MT0iMyIgeTE9IjEwIiB4Mj0iMjEiIHkyPSIxMCIvPjwvc3ZnPg==" alt="" width="24" height="24" style="{_icon_style}">'
    row2_parts.append(f'<span class="sep">|</span> {_timer_icon}{duration_m:.1f} min')
    row2_parts.append(f'<span class="sep">|</span> {_cal_icon}{run_dt}')
    if row2_parts:
        meta_rows += f'<tr><td>{"".join(row2_parts)}</td></tr>'

    meta_table = f'<table class="meta-table">{meta_rows}</table>' if meta_rows else ""

    # --- collect videos by spec file for separate cards ---
    spec_videos: dict[str, list[Path]] = {}
    for f in failures:
        spec = f.get("spec_file", "")
        for vid in f.get("videos", []):
            stem = vid.stem  # e.g. "vm-action.cy.ts"
            key = spec or stem
            spec_videos.setdefault(key, [])
            if vid not in spec_videos[key]:
                spec_videos[key].append(vid)
        if not spec:
            for ss in f.get("screenshots", []):
                parent = ss.parent.name
                if parent.endswith(".cy.ts"):
                    f["spec_file"] = parent
                    break

    # --- failure cards ---
    failure_cards = []
    for i, f in enumerate(failures, 1):
        screenshots_html = ""
        sorted_ss = sorted(f.get("screenshots", []),
                           key=lambda p: (int(m.group(1)) if (m := re.match(r"^(\d+)", p.name)) else 999, p.name))
        for ss in sorted_ss:
            try:
                uri = file_to_data_uri(ss)
                screenshots_html += (
                    f'<div class="screenshot">'
                    f'<img src="{uri}" alt="{_esc(ss.name)}" title="{_esc(ss.name)}" loading="lazy" '
                    f'onclick="openModal(this.src, \'{_esc(ss.name)}\')">'
                    f'</div>\n'
                )
            except Exception as e:
                screenshots_html += f'<div class="screenshot error">Could not load: {e}</div>\n'

        stack_trace_html = ""
        if f.get("stack_trace"):
            stack_trace_html = f"""
            <details class="stack-trace">
                <summary>Stack Trace</summary>
                <pre><code>{_esc(f['stack_trace'])}</code></pre>
            </details>"""

        suite_raw = f["name"]
        # Remove the test title (class without CNV ID prefix) from the end of name
        test_title = re.sub(r"^ID\([^)]*\)\s*", "", f["class"]).strip()
        if test_title and suite_raw.endswith(test_title):
            suite_raw = suite_raw[: -len(test_title)].rstrip()
        suite_parts = [p.strip() for p in re.split(r"  +", suite_raw) if p.strip()]
        suite_display = " | ".join(suite_parts)

        defect = _match_rp_defect(f, rp_items)
        defect_html = ""
        if defect and defect.get("item_id"):
            defect_html = (
                f'<div class="defect-control">'
                f'<div class="defect-top-row">'
                f'<select class="defect-select" data-item-id="{defect["item_id"]}" '
                f'data-current="{_esc(defect["issue_type"])}" data-original="{_esc(defect["issue_type"])}" '
                f'data-current-label="{_esc(defect["label"])}" data-current-color="{defect["color"]}" '
                f'style="background:{defect["color"]}" onchange="defectChanged(this)"></select>'
                f'<button class="save-defect" disabled onclick="saveDefect(this)" '
                f'title="Copy an agent command to update the defect type in ReportPortal"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>'
                f'</div>'
                f'<input type="text" class="defect-comment" placeholder="Comment..." disabled>'
                f'</div>'
            )
        elif defect:
            defect_html = f'<span class="defect-badge" style="background:{defect["color"]};">{_esc(defect["label"])}</span>'

        failure_cards.append(f"""
        <div class="failure-card-wrap">
        {defect_html}
        <details class="failure-card">
            <summary><span class="clickable"><span class="failure-number">#{i}</span> <span class="test-name">{_esc(f['class'])}</span></span><br><small>{_esc(suite_display)}</small></summary>
            <div class="failure-body">
            <div class="error-message"><pre>{_esc(f['error_message'])}</pre></div>
            {f'<div class="media-section"><div class="screenshots-grid">{screenshots_html}</div></div>' if screenshots_html else ''}
            {stack_trace_html}
            </div>
        </details>
        </div>""")

        # Insert video card after the last failure from this spec file
        cur_spec = f.get("spec_file", "")
        next_spec = failures[i].get("spec_file", "") if i < len(failures) else ""
        if cur_spec and cur_spec != next_spec and cur_spec in spec_videos:
            vids = spec_videos.pop(cur_spec)
            for vid in vids:
                try:
                    mime, _ = mimetypes.guess_type(str(vid))
                    vid_src = _video_relative_path(vid, out_dir) if out_dir else file_to_data_uri(vid)
                    failure_cards.append(f"""
        <details class="video-card">
            <summary class="video-label"><span class="clickable"><span class="video-spec-name">{_esc(vid.name)}</span></span></summary>
            <video controls><source src="{vid_src}" type="{mime}">Video not supported.</video>
        </details>""")
                except Exception as e:
                    failure_cards.append(f'<div class="video-card error">Could not load {_esc(vid.name)}: {e}</div>')

    # Remaining spec videos that didn't match any failure group
    for spec, vids in spec_videos.items():
        for vid in vids:
            try:
                mime, _ = mimetypes.guess_type(str(vid))
                vid_src = _video_relative_path(vid, out_dir) if out_dir else file_to_data_uri(vid)
                failure_cards.append(f"""
        <details class="video-card">
            <summary class="video-label"><span class="clickable"><span class="video-spec-name">{_esc(vid.name)}</span></span></summary>
            <video controls><source src="{vid_src}" type="{mime}">Video not supported.</video>
        </details>""")
            except Exception:
                pass

    # --- unmatched media ---
    unmatched_html = ""
    if unmatched_media:
        items = []
        for m in unmatched_media:
            ext = m.suffix.lower()
            try:
                if ext in {".mp4", ".webm", ".mov"}:
                    mime, _ = mimetypes.guess_type(str(m))
                    vid_src = _video_relative_path(m, out_dir) if out_dir else file_to_data_uri(m)
                    items.append(
                        f'<div class="media-item">'
                        f'<video controls><source src="{vid_src}" type="{mime}"></video>'
                        f'<p>{_esc(m.name)}</p></div>'
                    )
                else:
                    uri = file_to_data_uri(m)
                    items.append(
                        f'<div class="media-item">'
                        f'<img src="{uri}" alt="{_esc(m.name)}" title="{_esc(m.name)}" loading="lazy" '
                        f'onclick="openModal(this.src, \'{_esc(m.name)}\')">'
                        f'<p>{_esc(m.name)}</p></div>'
                    )
            except Exception:
                items.append(f'<div class="media-item error"><p>{_esc(m.name)} (could not load)</p></div>')
        unmatched_html = f"""
        <details class="failure-card unmatched-media">
            <summary><span class="clickable">Additional Media ({len(unmatched_media)})</span></summary>
            <div class="failure-body"><div class="media-grid">{''.join(items)}</div></div>
        </details>"""

    rootcoz_html = _render_rootcoz_cards(rootcoz_data)
    rootcoz_url = _rootcoz_header_url(rootcoz_data)
    rootcoz_btn = (
        f'<a class="rp-btn" href="{_esc(rootcoz_url)}" target="_blank" title="Open in RootCoz">'
        f'<img src="{_ROOTCOZ_ICON_SVG}" alt="RootCoz" width="32" height="32"></a>'
        if rootcoz_url
        else ""
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Failure Report — {_esc(job_name)}</title>
<style>
:root {{
    --bg: #1a1a2e;
    --surface: #16213e;
    --card: #0f3460;
    --accent: #e94560;
    --text: #eee;
    --text-muted: #aab;
    --success: #4caf50;
    --failure: #f44336;
    --unstable: #ff9800;
    --border: #2a2a4a;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 2rem;
}}
.container {{ max-width: 1200px; margin: 0 auto; }}

/* --- Header --- */
header {{
    background: var(--surface);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    border-left: 4px solid {result_color};
}}
header .title-row {{
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    margin-bottom: 0.75rem;
}}
header .title-row h1 {{
    font-size: 1.5rem; font-weight: 600; margin: 0;
}}
header .title-row h1 {{ color: #fddcbd; }}
.header-links {{
    display: inline-flex; align-items: center; gap: 0.5rem;
    margin-left: auto;
}}
.rp-btn {{
    display: inline-flex; align-items: center;
    background: none; border: none;
    padding: 0.2rem; color: #e0e0e0; text-decoration: none;
    opacity: 0.8; transition: opacity 0.2s;
}}
.rp-btn img {{ vertical-align: middle; }}
.rp-btn:hover {{ opacity: 1; }}
.meta-table {{
    border-collapse: collapse; margin-top: 0.75rem; font-size: 0.88rem;
}}
.meta-table td {{ padding: 0.25rem 0; color: var(--text); }}
.meta-table td .mono {{ font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.82rem; }}
.meta-table td a {{ color: #5dade2; text-decoration: none; }}
.meta-table td a:hover {{ text-decoration: underline; color: #85c1e9; }}
.meta-table td code {{ background: #1a1a1a; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.85rem; letter-spacing: 0.03em; }}
.sep {{ color: var(--border); margin: 0 0.6rem; }}
.cluster-link {{ font-size: 1.1rem; font-weight: 600; }}

/* --- Summary figures (inline in title row) --- */
.summary-figures {{
    display: inline-flex; align-items: baseline; gap: 0.9rem;
    font-size: 0.92rem; white-space: nowrap; margin-left: 5em;
}}
.summary-figures .fig {{ display: inline-flex; align-items: baseline; gap: 0.25rem; }}
.summary-figures .fig .num {{ font-weight: 700; font-size: 1.5rem; }}
.summary-figures .fig .lbl {{ color: var(--text-muted); font-size: 0.78rem; }}

.fw-badge {{
    display: inline-block; font-size: 0.7rem; font-weight: 700;
    padding: 0.15em 0.45em; border-radius: 4px; vertical-align: middle;
    margin-left: 0.4rem; letter-spacing: 0.04em;
}}
.fw-badge.pw {{ background: #e85d9a; color: #fff; }}
.fw-badge.cy {{ background: #69d3a7; color: #1b1e2b; }}

/* --- Failure cards --- */
.failure-card-wrap {{
    position: relative;
    margin-bottom: 1.5rem;
}}
.failure-card {{
    background: var(--surface); border-radius: 8px;
    border-left: 3px solid var(--failure);
}}
.failure-card > summary {{
    padding: 1rem 14rem 1rem 1.5rem; cursor: default; list-style: none;
    font-size: 1rem; word-break: break-word; color: #e0e0e0;
    pointer-events: none;
}}
.failure-card > summary::-webkit-details-marker {{ display: none; }}
.failure-card > summary::before {{ content: "\\25B6  "; font-size: 0.7rem; color: var(--text-muted); }}
.failure-card[open] > summary::before {{ content: "\\25BC  "; }}
.failure-card > summary:hover {{ background: rgba(255,255,255,0.03); }}
.failure-card > summary small {{ font-weight: 400; color: var(--text-muted); font-size: 0.88rem; }}
.failure-body {{ padding: 0 1.5rem 1.5rem; }}
.failure-number {{ font-weight: 700; color: var(--text-muted); margin-left: 0.3rem; margin-right: 0.4rem; }}
.defect-badge {{
    float: right; font-size: 0.82rem; font-weight: 600;
    padding: 0.25rem 0.55rem; border-radius: 5px; color: #1a1a1a;
    margin-left: auto; white-space: nowrap;
}}
.defect-control {{
    position: absolute; top: 0.7rem; right: 1rem;
    display: inline-flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;
}}
.defect-select {{
    font-size: 0.88rem; font-weight: 600;
    padding: 0.3rem 0.6rem; border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.18); color: #1a1a1a;
    cursor: pointer; max-width: 200px;
}}
.defect-select:focus {{ outline: 1px solid #5dade2; }}
.defect-top-row {{
    display: inline-flex; align-items: center; gap: 0.4rem;
}}
.defect-comment {{
    font-size: 0.82rem; padding: 0.25rem 0.5rem; border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08);
    color: #e0e0e0; width: 100%; box-sizing: border-box; outline: none;
}}
.defect-comment:disabled {{ opacity: 0.3; cursor: default; }}
.defect-comment:focus {{ border-color: #5dade2; }}
.defect-comment::placeholder {{ color: rgba(255,255,255,0.3); }}
.save-defect {{
    background: none; border: none; padding: 0;
    color: #666; line-height: 1;
    cursor: pointer; transition: color 0.15s;
    display: inline-flex; align-items: center;
}}
.save-defect:disabled {{ opacity: 0.3; cursor: default; }}
.save-defect:not(:disabled) {{ color: #aaa; }}
.save-defect:not(:disabled):hover {{ color: #ddd; }}
.save-defect.saved {{ color: #4caf50 !important; opacity: 1 !important; }}
.save-defect.failed {{ color: #f44336 !important; opacity: 1 !important; }}
.clickable {{
    pointer-events: auto; cursor: pointer; display: inline;
}}
.clickable:hover .test-name, .clickable:hover .video-spec-name {{ text-decoration: underline; }}
.video-card {{
    background: #2a2d32; border-radius: 8px;
    padding: 1rem 1.5rem; margin-bottom: 1.5rem;
    border-left: 3px solid #555;
}}
.video-card[open] {{ padding-bottom: 1.5rem; }}
.video-card video {{ max-width: 100%; border-radius: 6px; margin-top: 1rem; }}
.video-label {{
    font-size: 1rem; color: var(--text-muted);
    cursor: default; list-style: none; padding: 0; pointer-events: none;
}}
.video-label::-webkit-details-marker {{ display: none; }}
.video-label::before {{ content: "\\25B6  "; font-size: 0.7rem; }}
.video-card[open] > .video-label::before {{ content: "\\25BC  "; }}
.video-spec-name {{ color: #e0e0e0; }}
.error-message pre {{
    background: #1a1a1a; padding: 1rem; border-radius: 6px;
    overflow-x: auto; font-size: 0.85rem; white-space: pre-wrap;
    word-break: break-word; color: #ff8a80; margin-bottom: 0.75rem;
}}
.stack-trace {{ margin-bottom: 0.75rem; }}
.stack-trace summary {{
    cursor: pointer; color: var(--text-muted);
    font-size: 0.9rem; padding: 0.3rem 0;
}}
.stack-trace pre {{
    background: #1a1a1a; padding: 1rem; border-radius: 6px;
    overflow-x: auto; font-size: 0.8rem; white-space: pre-wrap;
    word-break: break-word; color: #ccc; max-height: 400px;
    overflow-y: auto; margin-top: 0.5rem;
}}

/* --- Media --- */
.media-section {{ margin-top: 1rem; }}
.media-section h4 {{ font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem; }}
.screenshots-grid {{
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
}}
.screenshot img, .media-item img {{
    max-width: 100%; border-radius: 6px;
    border: 1px solid var(--border); cursor: pointer;
    transition: opacity 0.15s;
}}
.screenshot img:hover, .media-item img:hover {{ opacity: 0.85; }}
.toggle-btn {{
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text-muted); padding: 0.25rem 0.7rem; border-radius: 4px;
    cursor: pointer; font-size: 0.78rem;
}}
.toggle-btn:hover {{ background: rgba(255,255,255,0.06); color: #e0e0e0;
}}
.video video, .media-item video {{
    max-width: 100%; border-radius: 6px; margin-bottom: 0.5rem;
}}
.media-grid {{
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}}
.media-item {{ background: var(--card); padding: 1rem; border-radius: 8px; }}
.media-item p {{ font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem; word-break: break-all; }}
.unmatched-media {{ margin-top: 1rem; border-left-color: #666; background: #2e3138; }}
.unmatched-media > summary {{ font-size: 1.05rem; }}

/* --- RootCoz (matches rootcoz ReportPage Key Takeaway) --- */
.rootcoz-section {{ margin-bottom: 2rem; }}
.rootcoz-toolbar {{ display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }}
.rootcoz-link {{ color: #f0883e; text-decoration: none; font-size: 0.82rem; font-family: ui-monospace, monospace; }}
.rootcoz-link:hover {{ text-decoration: underline; }}
.rc-key-takeaway-card {{
    border-radius: 8px;
    border-left: 4px solid #f0883e;
    background: rgba(240, 136, 62, 0.12);
    padding: 16px;
    margin-bottom: 1rem;
}}
.rc-key-takeaway-heading {{
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #f0883e;
    margin: 0 0 8px 0;
}}
.rc-key-takeaway-body {{
    font-size: 14px;
    line-height: 1.55;
    color: #9198a1;
    white-space: pre-wrap;
    word-break: break-word;
}}
.rc-failure-group {{
    background: rgba(255,255,255,0.02);
    border: 1px solid #30363d;
    border-radius: 8px;
    margin-bottom: 0.75rem;
}}
.rc-failure-group > summary {{
    padding: 0.85rem 1rem;
    cursor: default;
    list-style: none;
    font-size: 0.92rem;
    color: #e6edf3;
}}
.rc-failure-group > summary::-webkit-details-marker {{ display: none; }}
.rc-failure-group > summary::before {{ content: "\\25B6  "; font-size: 0.65rem; color: #9198a1; }}
.rc-failure-group[open] > summary::before {{ content: "\\25BC  "; }}
.rc-failure-group > summary small.rc-failure-preview {{
    display: block; margin-top: 0.35rem; color: #9198a1;
    font-weight: 400; font-size: 0.82rem;
}}
.rc-failure-body {{ padding: 0 1rem 1rem; }}
.rc-failure-name {{ font-weight: 500; }}
.rc-class-badge {{
    display: inline-block; font-size: 0.72rem; font-weight: 700;
    padding: 0.15em 0.5em; border-radius: 4px; color: #1a1a1a;
    margin-right: 0.5rem; vertical-align: middle;
}}
.rc-peer-analysis {{
    margin-top: 0.5rem;
    border: 1px solid #30363d;
    border-radius: 8px;
    background: rgba(1, 4, 9, 0.35);
    padding: 0.75rem 1rem;
}}
.rc-peer-analysis-header {{
    display: flex; align-items: center; gap: 0.6rem;
    flex-wrap: wrap; margin-bottom: 0.65rem;
}}
.rc-peer-analysis-title {{
    font-family: ui-monospace, monospace;
    font-size: 0.78rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: #c9d1d9;
}}
.rc-peer-consensus {{
    font-size: 0.72rem; font-weight: 600;
    padding: 0.12em 0.45em; border-radius: 4px;
}}
.rc-peer-consensus.yes {{ background: rgba(63, 185, 80, 0.15); color: #3fb950; }}
.rc-peer-consensus.no {{ background: rgba(248, 81, 73, 0.12); color: #f85149; }}
.rc-peer-consensus.unknown {{ background: rgba(240, 136, 62, 0.15); color: #f0883e; }}
.rc-peer-meta {{ color: #9198a1; font-size: 0.75rem; margin-left: auto; }}
.rc-peer-round {{
    background: rgba(255,255,255,0.02);
    border: 1px solid #21262d;
    border-radius: 6px;
    margin-bottom: 0.45rem;
}}
.rc-peer-round > summary {{
    padding: 0.55rem 0.75rem; cursor: default;
    list-style: none; font-size: 0.82rem; color: #c9d1d9;
}}
.rc-peer-round > summary::-webkit-details-marker {{ display: none; }}
.rc-peer-round > summary::before {{ content: "\\25B6  "; font-size: 0.6rem; color: #9198a1; }}
.rc-peer-round[open] > summary::before {{ content: "\\25BC  "; }}
.rc-peer-round-body {{
    padding: 0 0.75rem 0.75rem;
    font-size: 0.82rem; white-space: pre-wrap;
    word-break: break-word; color: #9198a1; line-height: 1.5;
}}
.peer-agree {{
    display: inline-block; font-size: 0.72rem; font-weight: 600;
    padding: 0.1em 0.4em; border-radius: 3px; margin-left: 0.4rem;
}}
.peer-agree.yes {{ background: rgba(63, 185, 80, 0.15); color: #3fb950; }}
.peer-agree.no {{ background: rgba(248, 81, 73, 0.12); color: #f85149; }}
.code-fix-block {{
    margin-top: 0.75rem; padding-top: 0.75rem;
    border-top: 1px solid #30363d; font-size: 0.88rem;
}}
.code-fix-meta {{ margin-bottom: 0.5rem; color: #9198a1; }}
.code-fix-desc {{ color: #c9d1d9; margin-bottom: 0.5rem; }}

/* --- Modal --- */
.modal-overlay {{
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.92); z-index: 9999;
    justify-content: center; align-items: center;
    cursor: zoom-out; flex-direction: column;
    overflow: hidden;
}}
.modal-overlay.active {{ display: flex; }}
.modal-overlay.zoomed {{
    overflow: auto;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 2rem;
    cursor: zoom-out;
}}
.modal-overlay img {{
    max-width: 95vw; max-height: 90vh;
    border-radius: 8px; object-fit: contain;
    cursor: zoom-in;
    transition: transform 0.2s ease;
    transform-origin: center center;
}}
.modal-overlay.zoomed img {{
    max-width: none; max-height: none;
    width: auto; height: auto;
    cursor: zoom-out;
    transform: scale(2);
}}
.modal-caption {{
    color: var(--text-muted); font-size: 0.85rem;
    margin-top: 0.75rem; text-align: center;
}}
.modal-close {{
    position: fixed; top: 1rem; right: 1.5rem;
    color: white; font-size: 2rem; cursor: pointer;
    background: none; border: none; z-index: 10000;
    opacity: 0.7; transition: opacity 0.15s;
}}
.modal-close:hover {{ opacity: 1; }}
.modal-nav {{
    position: fixed; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    color: white; font-size: 2rem; line-height: 1;
    padding: 0.4rem 0.85rem; cursor: pointer; border-radius: 6px;
    opacity: 0.65; transition: opacity 0.15s; z-index: 10001;
}}
.modal-nav:hover {{ opacity: 1; }}
.modal-prev {{ left: 1rem; }}
.modal-next {{ right: 1rem; }}

footer {{
    margin-top: 3rem; text-align: center;
    color: var(--text-muted); font-size: 0.8rem;
}}
</style>
</head>
<body>
<div class="container">
    <header>
        <div class="title-row">
            <h1>{_esc(job_name)}{fw_badge}</h1>
            <span class="summary-figures">
                <span class="fig"><span class="num">{total}</span><span class="lbl">Total</span></span>
                <span class="fig"><span class="num" style="color:var(--success)">{passed}</span><span class="lbl">Passed</span></span>
                <span class="fig"><span class="num" style="color:var(--failure)">{failed}</span><span class="lbl">Failed</span></span>
                <span class="fig"><span class="num" style="color:var(--text-muted)">{skipped}</span><span class="lbl">Skipped</span></span>
            </span>
            <span class="header-links">
            {f'<a class="rp-btn" href="{build_url}" target="_blank" title="Open in Jenkins"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAMsElEQVR42s1afZBk1VW/5/Xn7Ac9M7uQ5SsuRsVdQlhCRLJKzBqgrC1UUgoSSwJWoiYibgImqLs4RqOhwJQfMUDIH1JWDGRESRGDYBJnWE2o3eqEDSysmQATZnemme5+95779T66+73jH7k39dI1vcxMllRuVVdNv/f63vPxO+d3znkD7DVcRATuTyheZowxACD2o7iIKJiZmSkTUfBqyhFRmYhKBUXXvMqnytKzs7OlPXv2DAAgZ4zl7vqYUmoDETUGg0GtXC73AUBwzi0AJIyxQWGPEmMsX6tn4BQIXwKAzH+31v4MEf0SEb15MBjsCILgTCI6rV6vsyAIWJ7nLI7juFQqHSGir+d5/vnx8fGDAND3HnRGeG0V8BABgHx6erq6d+/edzPG/ogxdn61WmWVSoUxxpgxhg0Gg28DwFHG2ItE1GeMnQYAlwVBcOHmzZurWuulUql01+HDhz+1Z8+eZNgorwXOS/5vRLzKWvsiEZEQ4ouc83/r9XpkjHlFa32nMWbXKIxLKbeEYXidlPJJIiJr7Quc88uHzzila2pqKmCMMc755Vrrg0REURQ9h4iXIuKfRlE0iOP4nznnPzbsMRe0ZRfk36cUIl6RJMkLeZ5Tt9u9iTHGZmZmyq+J5YUQf05EZIzpaK1vddf+wnnhtsLzJ81GLhOV/DPHjh3brLX+AhFRu91+F2OMTU9Pl05ZenSWv8sJf2+n09nMGGNhGN7mhP+dYcGdkK8aa97aR48erRpjnoyiKFdK7TglSngrIeIVg8GAtNb7/L12u/02IiKp5T+4ZysAwIqWXeuamZmpJ0myJIT4mjNAcKqg87gxBjnnfyalfBwRjydJEmmtj8zPz9c9Kfk4cdieWFhYmCSi8qtxSafT2RxF0eVKqWvCMPxLZ5i9P1BQe+0R8U4HHTLGECK+hIiP9Ho9xTl/sOgpxhjrdrtXGWOeQkQTx3Eqpbx6lCAuwANEfMSfEUURZVlGYRh+qSjHWl1ZdsK/n4hIa32P1vrtUsot3qJCiHsRUTSbzYrHuhDinURESqlnhRAfttbe1el0zh8lSCG+LjfG/LYQ4mLO+S1aa6W1jhHxDWtWwgkDRFSSUi5KKWdWyCAghDgohHjObz43N1eTUraMMYeGiXKE8CODXAjxay45vHfNMCrk+9fHcUxhGL7PubrmBAGt9eustQNEvLtw6C+6Q6/xCq02n09NTQXes0eOHNnovM+FEB6i5fVg/y3W2pxzfnWhgiw75W7M85yklJd5AVqt1hla6yuJaBMRwfT0dImIIAzDC5IkeQIRL/H5nzHGWq3WGa1W64zCmdDpdM7v9/tzYRjuRcRHEPF576VVV66FYNyptc6FEL9fuFeZmpoKEPFfEZETUWXU5h6KURSd2+/3KQzDz/h87zz2Oc750z6DEVGglNqqtW4h4jc453cjYkxE9bUq4DWetNaSEOKDrgQYL8DleSHE40WFC+wKw8YQQnwiSRIKw/Bcf59zfkccx7kxZlsxHtrt9sVSykRr/RIi6sXFxa0rKTAyqoMgICICAOBJkjxTr9c/uGvXrla/3xfW2sfiOD4PAHIASL+vvAUgAMiKdf3s7KxX7kCe5xIADvj7APCFer0OvV7vWgCgOI5fL6W8p1KpXJfnebZp06bziCjYuHFjY6UKemRQ5HkeAEDebrd/sl6vn55lWYMx9oC1VoyNje2P4/hBxthRxtg7FhYWxgAgdgrTkOUBER8zxpyTZdlsnuc1ANjj7wHAEc75U/V6/Y65ubn70zQ9b2xs7N29Xi/I8/wZRPx2qVS6njFWWzOBEVFZSvm0tfbY8ePHzyGi03z5EMcxcc4fUkr1pZRvPQlJVaSUHzHGHEbE5TRNZxHxCgeXimuCLun3+ySlnHa/qSmlTncl9w1JkpCvi1bFBb54CsNwt6sMfwER92dZlhpjvqm1PgMRv5YkCRERIeLvriZPE1F11FmdTuf3Hfk95OACRASc831RFNHy8vLqyazAsh+IoignoskwDHdrrXMn8FeEEPelaTprjHnPqAAbKga/lwZdai1e82n5Zschny2w84EoiggRJ1c646TEAABJEASs0+nU6vV6pVargZTyPxhjKWPszlqt9p3hAB6xT+YPd89kQ9kuJ6IaAHySc16emJj4O631vzPGHg6CYEuv1xsIIaK1TCV8U/2NWq0GpVLp4jzPMwD4JhHdMjEx8Z3C4SXGWLaaaYJ/Zm5urrZ169YrqtXq1wHgFTcrShljrFQqHcrznGVZdhFj7GEi2skYe2n79u3pmuog96krpU5orb/q8ToMh3X0FSXH0sQ5v3t5eXlTu93+Kc75DVrrL7pq9DnHC4EQYgkRH11zLeQf5pz/lqvLP+bvNZvNSrfb3bkeJfxvEPG/XTwhEVGe52SMOR5F0Yfn5+d3ENFYu90+09Va+9fVIxcC6W6XIZ4SQnxAKfVYFEUUhuEFhZTr6yQYkZJLiHgzIv6BN5C19mbO+QFjzA3W2ssWFxe3drvdK9M0PSGE+C+l1DVERGEY7l53U1NQ4kZr7YtxHFOapiSlvJWI6qtJa76y9Q0LIs4j4seFEO+x1u4TQry92+3utNYmRERpmn4rDMOf45w/JKVEIhpbr7eHh7RMSrkvTdO42+2eXbSKlHJLr9e7jXP+puE+1mH5zZ1O5xLO+a9IKWcRkfr9Prm0eUgptUNrfb+U8urp6ekqEdWiKIoR8VOnZE7kWRMR39Dv94lzvq/Ipog4qbUmRPyyf94rQkQlIcQhY4wyxpzp91xcXNwwNze3YonAOf9jF+gXrbulHAUFIcRzQoinivh2199b7KCazWbFMy3n/KIoipbzPCdEfBQRb0fE34ii6HpEvMopWyOiihBiPI5jHYbhE6d0SufH5oj4vizLSCn1036c7huXAs6vK6ZOxhh7+eWXz7LWftwYczxJEjLGfA9CzhBVxhjTWj/Q6/Ve6Xa7Z69mVL/qOGg2mxXPB0mSLCPiw94LrqkPFhYWxpRST7jU+6FhCBYGX6/jnL/JWvsWRPzxQox91A0QXvCDgB9oxOjTY6GJ2aWUejxNU+r1eiSl/GixRiciWFxc3BBF0SfTNM2NMZ/3OD7ZQsSfsNb+S5IkuRDiPqXUiTiOB2EYXjtcT61rCt1ut8+UUt7rrKMR8U+EEMueHxDxuuXl5U3++Var9UZr7RHniUhK+VlEfJdSaiciTrq28Y2IeD0iPqC11m5CHXe73UuXlpZOt9Y+6fa/Y6WMeFKr++BrNpsVRLzFWmtdAP69MWabs9rtDsMxImZSShJCfBURpxExU0pFnPNOmqZERJRlGXHOI0RUQogeIsa9Xo+ckGkYhv9orT1ijNFSyi3NZrOitb7XGeHTLrMFqyIuV6O/w1r7vDvgPznnFxYx7WZGB5MkQc75PkTcL4SYHQwGhIjfarVa27vd7jla6yullJ/RWqcuwJc455/mnD/t3iUcFEJc7HqQtzqjvNOfFYbh7U6JPzzpeMW758SJE+cqpR50gs9LKX95KADBzXCg0+mcZa19tt/vUxRFf6u1vkBK+WVEbA7vb6291BjzsJTSIKJyHn3EB6krL85GxD7nfH+hqCwZYwaI+DcjFfD1jJTyZ621S66NOzA/P18vzi9H8MK4lPITHg5pmpIQ4v8KNVLJH9rtds+21lop5WFr7bPGmGNCiHHHAeWFhYUx/O66v+CB3c6r14/khUIX9hHHgD+/UjCPIjcvnFLq/VEUPcM5bw0pX3WQ2+32fxvn/AY3wD13KCMJRPynYvnS7/dJCLF9JCsXB1muWNvncD7mp3GjPkePHq268XrgMau1zotlg19a62vjOO5LKaW11vfU/xOG4a1CiJuEEH89GAyIc36jf1EShuGXOOfzheEXnDSAhRD/K6VcWC93cM4vzLJsIKW80WH/HET8TSnlV5RSaRRFCed8XgjxV0KID0kpn/djdUTkaZoqIcQDXiZjjBZC3LcSqcEK73xzRLy20Wh8DhHvAYBlAAiIaDUtI+R5zhhjZQC4FQBqeZ7PA8DpjUbjNAeHl4IgKBHROBF9DACSLMt2bdiw4aYkSR4loiXG2J5yuXx+lmVTeZ6fNTEx8XtCiF+dnJx8dPgV7LACAAB07Nixzdu2bTtUq9V2ZFnGANZMgCzLMuW+1hhjAyJKnZJldw5Uq9VNAMCSJCHGmGKM1QCgzBjrMcb6QRA0giBgvV5vPgiCS8bHx8Xw8GykZK1Wa+O2bdsCxhh1u901NxKVSqXcaDRICPFdaQtWaDQahIhsMBhk3nPlcrnUaDRyxhghYgAA0Gg0+l5GANA/1H9B+GEtWE0X9iMh6Iixzf8DcmAKYPeJNv8AAAAASUVORK5CYII=" alt="Jenkins" width="32" height="32"></a>' if build_url else ''}
            {f'<a class="rp-btn" href="{reportportal_url}?item0Params=filter.in.status%3DFAILED%26page.page%3D1" target="_blank" title="Open in ReportPortal"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTkuMDE3djQuNTA4YzAgLjM0LjE4MS42NTMuNDc1LjgyM2wxMy4wNSA3LjUyNWMuMjk0LjE3LjY1Ni4xNy45NSAwbDEzLjA1LTcuNTI1YS45NS45NSAwIDAgMCAuNDc1LS44MjN2LTYuMDZsLTE0IDguMTAxLTguMjk0LTQuNzgzdi01LjA1N0wwIDE5LjAxN1pNMTQgNi40MzRsOC4yOTQgNC43ODN2NS4xMzNMMjggMTMuMDZWOC40NzRhLjk1Ljk1IDAgMCAwLS40NzYtLjgyM0wxNC40NzYuMTI3YS45NTIuOTUyIDAgMCAwLS45NSAwTC40NzQgNy42NTJBLjk1Ljk1IDAgMCAwIDAgOC40NzV2Ni4xNjZsMTQtOC4yMDdaIiBmaWxsPSIjRjZGNkY3Ii8+PC9zdmc+" alt="ReportPortal" width="32" height="32"></a>' if reportportal_url else ''}
            {rootcoz_btn}
            </span>
        </div>
        {meta_table}
    </header>

    {rootcoz_html}

    <section>
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
            <h2 style="font-size:1.2rem; margin:0;">Test Failures</h2>
            <button class="toggle-btn" onclick="toggleAll(true)">Expand All</button>
            <button class="toggle-btn" onclick="toggleAll(false)">Collapse All</button>
        </div>
        {''.join(failure_cards) if failure_cards else '<p style="color: var(--text-muted);">No test failures found.</p>'}
    </section>
    {unmatched_html}
    <footer>
        <p>Generated by Jenkins Failure Diagnosis MCP &mdash; no credentials are embedded in this report.</p>
    </footer>
</div>

<!-- Fullscreen image modal -->
<div class="modal-overlay" id="imgModal" onclick="closeModal()">
    <button class="modal-close" onclick="event.stopPropagation(); closeModal()">&times;</button>
    <button class="modal-nav modal-prev" onclick="event.stopPropagation(); navScreenshot(-1)" title="Previous (&larr;)">&#8249;</button>
    <img id="modalImg" src="" alt="" onclick="event.stopPropagation(); toggleZoom(event)">
    <button class="modal-nav modal-next" onclick="event.stopPropagation(); navScreenshot(1)" title="Next (&rarr;)">&#8250;</button>
    <div class="modal-caption" id="modalCaption"></div>
</div>
<script>
var SAVE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
var DEFECT_TYPES = {defect_types_json};
var RP_LAUNCH_URL = "{rp_launch_url}";
var screenshotGallery = [];
var screenshotCaptions = [];
var currentScreenshotIndex = -1;
function populateDropdowns(defectTypes, rpItems) {{
    document.querySelectorAll('.defect-select').forEach(function(sel) {{
        var itemId = sel.dataset.itemId;
        var matched = null;
        if (rpItems) {{
            var card = sel.closest('.failure-card-wrap');
            var nameEl = card && card.querySelector('.test-name');
            if (nameEl) {{
                var name = nameEl.textContent.trim().toLowerCase();
                var nameKey = name.split('.')[0].trim();
                matched = rpItems[name] || rpItems[nameKey] || null;
            }}
        }}
        var current, curLabel, curColor;
        if (matched) {{
            current = matched.issue_type;
            curLabel = matched.label;
            curColor = matched.color;
            sel.dataset.current = current;
            sel.dataset.original = current;
            sel.dataset.currentLabel = curLabel;
            sel.dataset.currentColor = curColor;
            if (matched.item_id) sel.dataset.itemId = matched.item_id;
        }} else {{
            current = sel.dataset.current;
            curLabel = sel.dataset.currentLabel;
            curColor = sel.dataset.currentColor;
        }}
        sel.innerHTML = '';
        var pfx = current ? current.substring(0,2) : '';
        if (curLabel) {{
            var o = document.createElement('option');
            o.value = current; o.textContent = curLabel; o.dataset.color = curColor;
            o.selected = true; sel.appendChild(o);
        }}
        var types = defectTypes || DEFECT_TYPES;
        types.forEach(function(dt) {{
            if (dt.locator === current || dt.locator.substring(0,2) === pfx) return;
            var opt = document.createElement('option');
            opt.value = dt.locator; opt.textContent = dt.label; opt.dataset.color = dt.color;
            sel.appendChild(opt);
        }});
        updateSelectColor(sel);
        var ctrl = sel.closest('.defect-control');
        if (ctrl) {{
            var ci = ctrl.querySelector('.defect-comment');
            var sb = ctrl.querySelector('.save-defect');
            if (ci) {{ ci.disabled = true; ci.value = ''; }}
            if (sb) {{ sb.disabled = true; sb.innerHTML = SAVE_ICON; sb.classList.remove('saved','failed'); }}
        }}
    }});
}}
document.addEventListener('DOMContentLoaded', function() {{
    buildScreenshotGallery();
    populateDropdowns(null, null);
    document.querySelectorAll('.failure-card .clickable, .video-card .clickable, .rc-failure-group .clickable, .rc-peer-round .clickable').forEach(function(el) {{
        el.addEventListener('click', function(e) {{
            e.preventDefault();
            var d = this.closest('details'); d.open = !d.open;
        }});
    }});
}});
function updateSelectColor(sel) {{
    var opt = sel.options[sel.selectedIndex];
    if (opt && opt.dataset.color) sel.style.background = opt.dataset.color;
}}
function defectChanged(sel) {{
    updateSelectColor(sel);
    var ctrl = sel.closest('.defect-control');
    var saveBtn = ctrl.querySelector('.save-defect');
    var commentInput = ctrl.querySelector('.defect-comment');
    var changed = (sel.value !== sel.dataset.original);
    saveBtn.disabled = !changed;
    commentInput.disabled = !changed;
}}
function saveDefect(btn) {{
    // No credentials are embedded in this file. The button copies a ready-made
    // instruction for the agent, which calls the update_defect_type MCP tool
    // server-side (the ReportPortal bearer token never leaves that process).
    var ctrl = btn.closest('.defect-control');
    var commentInput = ctrl.querySelector('.defect-comment');
    var sel = ctrl.querySelector('.defect-select');
    var itemId = sel.dataset.itemId;
    var issueType = sel.value;
    var comment = commentInput.value.trim();
    var instruction = 'update_defect_type rp_url=' + RP_LAUNCH_URL
        + ' item_id=' + itemId + ' issue_type=' + issueType;
    if (comment) instruction += '\ncomment: ' + comment;
    var done = function() {{
        sel.dataset.original = issueType;
        commentInput.value = '';
        btn.innerHTML = '&#10003;'; btn.classList.add('saved'); btn.disabled = true;
        setTimeout(function() {{ btn.innerHTML = SAVE_ICON; btn.classList.remove('saved'); }}, 1500);
    }};
    var fail = function() {{
        btn.innerHTML = '&#10007;'; btn.classList.add('failed');
        setTimeout(function() {{ btn.innerHTML = SAVE_ICON; btn.classList.remove('failed'); btn.disabled = false; }}, 2000);
    }};
    if (navigator.clipboard && navigator.clipboard.writeText) {{
        navigator.clipboard.writeText(instruction).then(done).catch(fail);
    }} else {{
        fail();
    }}
}}
function buildScreenshotGallery() {{
    screenshotGallery = [];
    screenshotCaptions = [];
    document.querySelectorAll('.screenshot img, .media-item img').forEach(function(img) {{
        if (!img.src) return;
        screenshotGallery.push(img.src);
        screenshotCaptions.push(img.getAttribute('title') || img.alt || '');
    }});
}}
function showModalAt(idx) {{
    if (idx < 0 || idx >= screenshotGallery.length) return;
    currentScreenshotIndex = idx;
    document.getElementById('modalImg').src = screenshotGallery[idx];
    var cap = screenshotCaptions[idx] || '';
    if (screenshotGallery.length > 1) {{
        cap += (cap ? ' — ' : '') + (idx + 1) + '/' + screenshotGallery.length;
    }}
    document.getElementById('modalCaption').textContent = cap;
    var modal = document.getElementById('imgModal');
    modal.classList.add('active');
    modal.classList.remove('zoomed');
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.modal-nav').forEach(function(btn) {{
        btn.style.visibility = screenshotGallery.length > 1 ? 'visible' : 'hidden';
    }});
}}
function openModal(src, caption) {{
    if (!screenshotGallery.length) buildScreenshotGallery();
    var idx = screenshotGallery.indexOf(src);
    if (idx < 0) {{
        screenshotGallery.push(src);
        screenshotCaptions.push(caption || '');
        idx = screenshotGallery.length - 1;
    }}
    showModalAt(idx);
}}
function toggleZoom(e) {{
    var modal = document.getElementById('imgModal');
    var wasZoomed = modal.classList.contains('zoomed');
    modal.classList.toggle('zoomed');
    if (!wasZoomed) {{
        // Keep the click point under the cursor when zooming in
        if (e) {{
            var r = modal.getBoundingClientRect();
            var xPct = ((e.clientX - r.left) / r.width) * 100;
            var yPct = ((e.clientY - r.top) / r.height) * 100;
            modal.scrollLeft = (modal.scrollWidth - r.width) * (xPct / 100);
            modal.scrollTop = (modal.scrollHeight - r.height) * (yPct / 100);
        }}
    }} else {{
        modal.scrollTop = 0;
        modal.scrollLeft = 0;
    }}
}}
function navScreenshot(delta) {{
    if (currentScreenshotIndex < 0) return;
    var next = currentScreenshotIndex + delta;
    if (next >= 0 && next < screenshotGallery.length) showModalAt(next);
}}
function closeModal() {{
    var m = document.getElementById('imgModal');
    m.classList.remove('active');
    m.classList.remove('zoomed');
    document.body.style.overflow = '';
    currentScreenshotIndex = -1;
}}
document.addEventListener('keydown', function(e) {{
    var m = document.getElementById('imgModal');
    if (!m.classList.contains('active')) return;
    if (e.key === 'Escape') {{
        if (m.classList.contains('zoomed')) {{
            m.classList.remove('zoomed');
            m.scrollTop = 0;
            m.scrollLeft = 0;
        }} else {{
            closeModal();
        }}
    }}
    if (e.key === 'ArrowLeft') {{ e.preventDefault(); navScreenshot(-1); }}
    if (e.key === 'ArrowRight') {{ e.preventDefault(); navScreenshot(1); }}
}});
    document.querySelectorAll('details.failure-card, details.video-card').forEach(function(d) {{
        d.open = expand;
    }});
}}
</script>
</body>
</html>"""


# ---------------------------------------------------------------------------
# MCP Tool Definitions
# ---------------------------------------------------------------------------

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_build_info",
            description="Fetch build metadata, parameters, and status from a Jenkins job URL",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {
                        "type": "string",
                        "description": "Jenkins job URL with optional build number. If omitted the last build is used. E.g. .../job/my-job/42 or .../job/my-job/",
                    }
                },
                "required": ["job_url"],
            },
        ),
        Tool(
            name="get_test_report",
            description="Fetch detailed test report with all failures from a Jenkins build",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {"type": "string", "description": "Jenkins job/build URL"}
                },
                "required": ["job_url"],
            },
        ),
        Tool(
            name="get_console_log",
            description="Fetch console output (build log) from a Jenkins build",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {"type": "string", "description": "Jenkins job/build URL"}
                },
                "required": ["job_url"],
            },
        ),
        Tool(
            name="get_artifact",
            description="Fetch a single artifact file by relative path from a Jenkins build",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {"type": "string", "description": "Jenkins job/build URL"},
                    "artifact_path": {
                        "type": "string",
                        "description": "Relative path of the artifact, e.g. build-info.json",
                    },
                },
                "required": ["job_url", "artifact_path"],
            },
        ),
        Tool(
            name="download_artifacts",
            description="Download and extract the full artifact archive from a Jenkins build into ~/jenkins-reports/<job>#<build>/",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {"type": "string", "description": "Jenkins job/build URL"},
                },
                "required": ["job_url"],
            },
        ),
        Tool(
            name="generate_failure_report",
            description=(
                "Full pipeline: fetch build info, test report, download artifact archive, "
                "match screenshots/videos to failures, optionally embed RootCoz Key Takeaway "
                "and peer analysis, and generate a self-contained HTML report. "
                "All files saved to ~/jenkins-reports/<job>#<build>/ — open failure-report.html directly."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {"type": "string", "description": "Jenkins job/build URL"},
                },
                "required": ["job_url"],
            },
        ),
        Tool(
            name="update_defect_type",
            description=(
                "Update the defect type of a failed test item in ReportPortal. "
                "Requires RP_TOKEN env var. issue_type is the locator string, "
                "e.g. pb001 (Product Bug), si001 (System Issue), ab001 (Automation Bug), "
                "nd001 (No Defect), ti001 (To Investigate)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "rp_url": {
                        "type": "string",
                        "description": "ReportPortal launch URL, e.g. https://host/ui/#project/launches/all/12345",
                    },
                    "item_id": {
                        "type": "integer",
                        "description": "ReportPortal test item ID",
                    },
                    "issue_type": {
                        "type": "string",
                        "description": "Defect type locator, e.g. si001, pb001, ab001, nd001, ti001",
                    },
                },
                "required": ["rp_url", "item_id", "issue_type"],
            },
        ),
        Tool(
            name="trigger_build",
            description="Trigger a new build of a Jenkins job (re-run last build with same parameters)",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {
                        "type": "string",
                        "description": "Jenkins job URL (e.g. .../job/my-job/ or .../job/my-job/42). Uses the job path to trigger a new build.",
                    },
                },
                "required": ["job_url"],
            },
        ),
        Tool(
            name="build_with_parameters",
            description="Trigger a Jenkins build with specific parameters",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_url": {
                        "type": "string",
                        "description": "Jenkins job URL (e.g. .../job/my-job/)",
                    },
                    "parameters": {
                        "type": "object",
                        "description": "Key-value pairs of build parameters to pass",
                    },
                },
                "required": ["job_url", "parameters"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        if name == "update_defect_type":
            result = await _update_defect_type(arguments)
            return [TextContent(type="text", text=result)]
        client = get_client()
        result = await _dispatch(client, name, arguments)
        await client.close()
        return [TextContent(type="text", text=result)]
    except httpx.HTTPStatusError as e:
        return [TextContent(type="text", text=f"Jenkins API error {e.response.status_code}: {e.response.text[:500]}")]
    except Exception as e:
        logger.exception("Tool error")
        return [TextContent(type="text", text=f"Error: {type(e).__name__}: {e}")]


async def _update_defect_type(args: dict) -> str:
    """Update defect type for a test item in ReportPortal."""
    rp_token = os.environ.get("RP_TOKEN", "")
    if not rp_token:
        return json.dumps({"error": "RP_TOKEN env var not set"})

    rp_url = args["rp_url"]
    item_id = args["item_id"]
    issue_type = args["issue_type"]

    m = re.search(r"(https?://[^/]+).*?#(\w+)/launches/\w+/(\d+)", rp_url)
    if not m:
        return json.dumps({"error": f"Could not parse RP URL: {rp_url}"})
    host, project = m.group(1), m.group(2)
    api_base = f"{host}/api/v1/{project}"

    async with httpx.AsyncClient(verify=False, timeout=httpx.Timeout(15.0)) as http:
        headers = {"Authorization": f"Bearer {rp_token}", "Content-Type": "application/json"}
        resp = await http.put(f"{api_base}/item", headers=headers, json={
            "issues": [{
                "testItemId": item_id,
                "issue": {
                    "issueType": issue_type,
                    "autoAnalyzed": False,
                    "ignoreAnalyzer": False,
                }
            }]
        })
        if resp.status_code == 200:
            return json.dumps({"success": True, "item_id": item_id, "issue_type": issue_type})
        else:
            return json.dumps({"error": f"HTTP {resp.status_code}", "body": resp.text[:500]})


async def _dispatch(client: JenkinsClient, name: str, args: dict) -> str:
    if "job_url" in args and name not in ("trigger_build", "build_with_parameters"):
        args = {**args, "job_url": await resolve_job_url(client, args["job_url"])}
    if name == "get_build_info":
        return await _get_build_info(client, args["job_url"])
    elif name == "get_test_report":
        return await _get_test_report(client, args["job_url"])
    elif name == "get_console_log":
        return await _get_console_log(client, args["job_url"])
    elif name == "get_artifact":
        return await _get_artifact(client, args["job_url"], args["artifact_path"])
    elif name == "download_artifacts":
        return await _download_artifacts(client, args["job_url"])
    elif name == "generate_failure_report":
        return await _generate_failure_report(client, args["job_url"])
    elif name == "trigger_build":
        return await _trigger_build(client, args["job_url"])
    elif name == "build_with_parameters":
        return await _build_with_parameters(client, args["job_url"], args.get("parameters", {}))
    else:
        return f"Unknown tool: {name}"


async def _trigger_build(client: JenkinsClient, job_url: str) -> str:
    """Trigger a new build of a Jenkins job (re-run with same parameters as last build)."""
    parsed = urlparse(job_url)
    path = parsed.path.rstrip("/")
    # Strip build number if present
    if re.match(r".*/\d+$", path):
        path = "/".join(path.split("/")[:-1])
    url = f"{client.base_url}{path}/build"
    resp = await client.http.post(url)
    if resp.status_code in (201, 302):
        location = resp.headers.get("Location", "")
        return json.dumps({"success": True, "message": "Build triggered", "queue_url": location})
    else:
        return json.dumps({"error": f"HTTP {resp.status_code}", "body": resp.text[:500]})


async def _build_with_parameters(client: JenkinsClient, job_url: str, parameters: dict) -> str:
    """Trigger a Jenkins build with specific parameters."""
    parsed = urlparse(job_url)
    path = parsed.path.rstrip("/")
    # Strip build number if present
    if re.match(r".*/\d+$", path):
        path = "/".join(path.split("/")[:-1])
    url = f"{client.base_url}{path}/buildWithParameters"
    resp = await client.http.post(url, data=parameters)
    if resp.status_code in (201, 302):
        location = resp.headers.get("Location", "")
        return json.dumps({"success": True, "message": "Build triggered with parameters", "queue_url": location})
    else:
        return json.dumps({"error": f"HTTP {resp.status_code}", "body": resp.text[:500]})


async def _get_build_info(client: JenkinsClient, job_url: str) -> str:
    url = normalize_job_url(job_url)
    data = await client.get_json(url)
    params = extract_build_parameters(data)
    summary = {
        "fullDisplayName": data.get("fullDisplayName"),
        "result": data.get("result"),
        "building": data.get("building"),
        "duration": data.get("duration"),
        "timestamp": data.get("timestamp"),
        "url": data.get("url"),
        "builtOn": data.get("builtOn"),
        "parameters": params,
        "artifacts": [a.get("relativePath") for a in data.get("artifacts", [])],
    }
    for action in data.get("actions", []):
        if isinstance(action, dict) and action.get("_class", "").endswith("TestResultAction"):
            summary["test_summary"] = {
                "totalCount": action.get("totalCount"),
                "failCount": action.get("failCount"),
                "skipCount": action.get("skipCount"),
            }
    return json.dumps(summary, indent=2)


async def _get_test_report(client: JenkinsClient, job_url: str) -> str:
    url = normalize_job_url(job_url)
    try:
        data = await client.get_json(url.rstrip("/") + "/testReport")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return json.dumps({"error": "No test report found for this build."})
        raise
    failures = parse_test_failures(data)
    return json.dumps({
        "total": data.get("totalCount", 0),
        "failures": data.get("failCount", 0),
        "skipped": data.get("skipCount", 0),
        "failed_tests": failures,
    }, indent=2, default=str)


async def _get_console_log(client: JenkinsClient, job_url: str) -> str:
    url = normalize_job_url(job_url)
    text = await client.get_text(url.rstrip("/") + "/consoleText")
    if len(text) > 100_000:
        return f"[Truncated to last 100k chars — full log is {len(text)} chars]\n\n" + text[-100_000:]
    return text


async def _get_artifact(client: JenkinsClient, job_url: str, artifact_path: str) -> str:
    url = normalize_job_url(job_url)
    artifact_url = url.rstrip("/") + "/artifact/" + artifact_path.lstrip("/")
    text = await client.get_text(artifact_url)
    return text


async def _download_artifacts(client: JenkinsClient, job_url: str) -> str:
    url = normalize_job_url(job_url)
    out_dir = job_output_dir(job_url)
    out_dir.mkdir(parents=True, exist_ok=True)

    archive_url = url.rstrip("/") + "/artifact/*zip*/archive.zip"
    zip_path = out_dir / "archive.zip"

    logger.info("Downloading artifacts to %s", zip_path)
    await client.download_to_file(archive_url, zip_path)

    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(out_dir)

    files = sorted(str(p.relative_to(out_dir)) for p in out_dir.rglob("*") if p.is_file())
    return json.dumps({
        "output_dir": str(out_dir),
        "file_count": len(files),
        "files": files[:200],
    }, indent=2)


async def _generate_failure_report(client: JenkinsClient, job_url: str) -> str:
    url = normalize_job_url(job_url)
    out_dir = job_output_dir(job_url)
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Build info + parameters + ReportPortal link
    build_info = await client.get_json(url)
    build_params = extract_build_parameters(build_info)
    rp_url = extract_reportportal_url(build_info)
    rp_data = await fetch_rp_defects(rp_url)

    # 2. Test counts from actions
    test_counts = {"total": 0, "failed": 0, "skipped": 0}
    for action in build_info.get("actions", []):
        if isinstance(action, dict) and action.get("_class", "").endswith("TestResultAction"):
            test_counts = {
                "total": action.get("totalCount", 0),
                "failed": action.get("failCount", 0),
                "skipped": action.get("skipCount", 0),
            }
            break

    # 3. Test failures
    test_report_available = True
    try:
        test_data = await client.get_json(url.rstrip("/") + "/testReport")
        failures = parse_test_failures(test_data)
        # Empty report body with no suites counts as "no results"
        if (
            int(test_counts.get("total") or 0) == 0
            and not failures
            and not test_data.get("suites")
            and not test_data.get("childReports")
        ):
            test_report_available = False
    except httpx.HTTPStatusError:
        failures = []
        test_report_available = False

    # 4. Download and extract artifact archive (streaming to disk)
    # Jenkins' *zip* endpoint is chunked-transfer fragile for large archives
    # (≈40 MB with screenshots). On failure, fall back to per-file downloads
    # via /artifact/<relativePath> which we already use successfully for
    # single screenshots.
    artifact_files: dict[str, Path] = {}
    try:
        archive_url = url.rstrip("/") + "/artifact/*zip*/archive.zip"
        zip_path = out_dir / "archive.zip"
        logger.info("Downloading artifact archive to %s …", zip_path)
        await client.download_to_file(archive_url, zip_path)

        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(out_dir)

        for p in out_dir.rglob("*"):
            if p.is_file() and p.name != "archive.zip":
                artifact_files[str(p.relative_to(out_dir))] = p
    except (httpx.HTTPStatusError, httpx.RemoteProtocolError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
        logger.warning("Archive download failed (%s) — falling back to per-file artifacts…", e)
        # Per-file fallback: fetch only what the report needs (screenshots, videos,
        # run/build metadata, Cypress JSON). Uses build_info['artifacts'] already
        # fetched, so no extra API call. Each file is small and individually
        # retried via httpx's default timeout.
        import urllib.parse

        wanted_suffixes = (
            ".png",
            ".mp4",
            ".webm",
            ".json",
            ".xml",
            ".html",
            ".log",
            ".txt",
        )
        for art in build_info.get("artifacts", []):
            rel = art.get("relativePath", "")
            if not rel or not rel.lower().endswith(wanted_suffixes):
                continue
            dest = out_dir / rel
            # Keep report fast: skip duplicate asset copies and huge node_modules
            if "node_modules" in rel or "/assets/" in rel:
                continue
            try:
                art_url = url.rstrip("/") + "/artifact/" + urllib.parse.quote(rel, safe="/")
                data = await client.get_bytes(art_url)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                artifact_files[rel] = dest
            except (httpx.HTTPStatusError, httpx.RemoteProtocolError, httpx.ReadTimeout) as art_e:
                logger.debug("Skipping artifact %s: %s", rel, art_e)
        if artifact_files:
            logger.info("Per-file fallback fetched %d artifacts", len(artifact_files))
        else:
            logger.warning("Per-file fallback fetched nothing — report will use Jenkins testReport only")
    # 4b. Fallback: when the Jenkins test report has no results, parse failed
    # tests from the artifact's Cypress reports (mochawesome JSON, JUnit XML).
    if not failures and artifact_files:
        artifact_failures = parse_cypress_artifact_failures(out_dir)
        if artifact_failures:
            logger.info("Parsed %d failures from artifact Cypress reports", len(artifact_failures))
            failures = artifact_failures
            test_report_available = True
            if int(test_counts.get("total") or 0) == 0:
                failed = len(artifact_failures)
                test_counts = {"total": failed, "failed": failed, "skipped": 0}

    # 5. Read metadata from artifact JSON files
    run_meta = extract_run_metadata(out_dir)
    metadata = resolve_metadata(run_meta, build_params)

    # 7. Detect Playwright (Allure results) vs Cypress (filename-based screenshots)
    allure_dir = _find_allure_dir(out_dir)
    if allure_dir:
        # Playwright mode: use the Jenkins-processed Allure report as the authoritative
        # source of failures (correct final status, correct screenshot filenames).
        # Fall back to raw allure-results parsing only if the endpoint is unavailable.
        logger.info("Allure results found at %s — fetching processed Allure report", allure_dir)
        allure_failures = await fetch_allure_report_failures(client, url, out_dir)
        if allure_failures is not None:
            failures = allure_failures
        else:
            logger.info("Allure report endpoint unavailable — falling back to raw allure-results")
            failures = parse_allure_failures(allure_dir)
        unmatched = []
    else:
        # Cypress mode: match screenshots/videos to JUnit failures by filename
        unmatched = match_media_to_failures(failures, artifact_files)

        # 7b. Derive spec_file from matched screenshots (majority vote)
        for f in failures:
            if not f.get("spec_file"):
                counts: dict[str, int] = {}
                for ss in f.get("screenshots", []):
                    parent = ss.parent.name
                    if parent.endswith(".cy.ts"):
                        counts[parent] = counts.get(parent, 0) + 1
                if counts:
                    f["spec_file"] = max(counts, key=counts.get)
        # Fill in missing spec_file from nearest neighbour by timestamp
        def _ts_key(ts: str) -> int:
            try:
                parts = ts.split("T")[1].split(":")
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            except (IndexError, ValueError):
                return 0

        anchors = [(f["suite_timestamp"], f["spec_file"]) for f in failures if f.get("spec_file") and f.get("suite_timestamp")]
        for f in failures:
            if not f.get("spec_file") and f.get("suite_timestamp") and anchors:
                t = _ts_key(f["suite_timestamp"])
                f["spec_file"] = min(anchors, key=lambda a: abs(_ts_key(a[0]) - t))[1]
        # Sort by suite timestamp then screenshot number
        for f in failures:
            ss_num = 999
            for ss in f.get("screenshots", []):
                m = re.match(r"^(\d+)_", ss.name)
                if m:
                    ss_num = min(ss_num, int(m.group(1)))
            f["_ss_num"] = ss_num
        failures.sort(key=lambda f: (f.get("suite_timestamp", ""), f["_ss_num"], f["exec_order"]))

    # 8. RootCoz analysis (optional — when ROOTCOZ_URL / ROOTCOZ_API_KEY are set)
    build_url = build_info.get("url", url)
    rootcoz_data = await fetch_rootcoz_analysis(build_url)

    # 9. Generate HTML report
    html = generate_html_report(
        build_info, failures, unmatched, metadata, test_counts,
        rp_url, rp_data, out_dir=out_dir, rootcoz_data=rootcoz_data,
    )
    _assert_no_embedded_secrets(html)
    report_path = out_dir / "failure-report.html"
    report_path.write_text(html, encoding="utf-8")

    # Skip auto-open when tests never ran (0 tests / no specs / no results).
    console_text = ""
    did_not_run, skip_reason = _tests_did_not_run(
        test_counts, failures, test_report_available=test_report_available,
    )
    if did_not_run or not test_report_available:
        try:
            console_text = await client.get_text(url.rstrip("/") + "/consoleText")
        except Exception as e:
            logger.warning("Could not fetch console for open-skip check: %s", e)
        did_not_run, skip_reason = _tests_did_not_run(
            test_counts,
            failures,
            test_report_available=test_report_available,
            console_text=console_text,
        )

    opened = False
    if did_not_run:
        logger.info("Skipping browser open: tests did not run (%s)", skip_reason or "unknown")
    else:
        opened = _open_report_in_browser(report_path)

    message = f"Report generated at {report_path}"
    if opened:
        message += " and opened in browser."
    elif did_not_run:
        message += (
            f". Not opened in browser (tests did not run: {skip_reason or 'no results'})."
        )
    else:
        message += ". Open the HTML file in your browser."

    return json.dumps({
        "output_dir": str(out_dir),
        "report_path": str(report_path),
        "opened_in_browser": opened,
        "tests_did_not_run": did_not_run,
        "skip_open_reason": skip_reason or None,
        "failures_count": len(failures),
        "test_counts": test_counts,
        "artifacts_extracted": len(artifact_files),
        "unmatched_media": len(unmatched),
        "metadata": metadata,
        "mode": "playwright-allure" if allure_dir else "cypress",
        "rootcoz_available": bool(
            rootcoz_data
            and not rootcoz_data.get("_rootcoz_pending")
            and (rootcoz_data.get("result") or {}).get("failures")
        ),
        "rootcoz_pending": bool(rootcoz_data and rootcoz_data.get("_rootcoz_pending")),
        "message": message,
    }, indent=2)


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
