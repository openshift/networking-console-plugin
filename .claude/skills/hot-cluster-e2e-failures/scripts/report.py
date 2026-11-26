#!/usr/bin/env python3
"""Download a Hot Cluster E2E Cypress artifact and write a self-contained HTML report."""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree

RUN_URL = re.compile(
    r"https?://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+)/actions/runs/(?P<run_id>\d+)"
)
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
VIDEO_EXT = {".mp4", ".webm"}


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    return result.stdout


def parse_run_url(url: str) -> tuple[str, str, str]:
    match = RUN_URL.search(url.strip())
    if not match:
        raise SystemExit(f"Not a GitHub Actions run URL: {url}")
    return match.group("owner"), match.group("repo"), match.group("run_id")


def gh_json(path: str) -> dict | list:
    return json.loads(run(["gh", "api", path]))


def download_cypress_artifact(owner: str, repo: str, run_id: str, dest: Path) -> Path:
    artifacts = gh_json(f"repos/{owner}/{repo}/actions/runs/{run_id}/artifacts")
    names = [item["name"] for item in artifacts.get("artifacts", [])]
    chosen = next((name for name in names if name.startswith("cypress-results")), None)
    if not chosen:
        raise SystemExit(
            "No cypress-results artifact on this run. Found: " + (", ".join(names) or "(none)")
        )
    dest.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "gh",
            "run",
            "download",
            run_id,
            "--repo",
            f"{owner}/{repo}",
            "--name",
            chosen,
            "--dir",
            str(dest),
        ],
        check=True,
    )
    return dest


def walk_files(root: Path) -> list[Path]:
    return [path for path in root.rglob("*") if path.is_file() and not path.name.startswith(".")]


def load_mochawesome(root: Path) -> list[dict]:
    tests: list[dict] = []
    json_files = [
        path
        for path in walk_files(root)
        if path.suffix == ".json" and "cypress" in path.name.lower()
    ]
    # Prefer the merged report when both exist.
    json_files.sort(key=lambda path: (path.name not in {"cypress.json", "cypress_report.json"}, path.name))

    def visit(node: dict, titles: list[str]) -> None:
        title = node.get("title") or ""
        next_titles = titles + ([title] if title else [])
        for test in node.get("tests") or []:
            state = test.get("state") or test.get("pass")
            if state is True:
                state = "passed"
            elif state is False:
                state = "failed"
            err = test.get("err") or {}
            tests.append(
                {
                    "title": test.get("fullTitle") or " ".join(next_titles + [test.get("title") or ""]).strip(),
                    "name": test.get("title") or "",
                    "state": state or "unknown",
                    "message": err.get("message") or "",
                    "stack": err.get("estack") or err.get("stack") or "",
                    "spec": "",
                }
            )
        for suite in node.get("suites") or []:
            visit(suite, next_titles)

    seen: set[str] = set()
    for path in json_files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        before = len(tests)
        results = data.get("results") if isinstance(data, dict) else None
        if isinstance(results, list):
            for result in results:
                if isinstance(result, dict):
                    visit(result, [])
        elif isinstance(data, dict) and (data.get("tests") or data.get("suites")):
            visit(data, [])
        if len(tests) > before:
            spec = path.stem
            for test in tests[before:]:
                test["spec"] = spec
            # One good report is enough; merged files repeat the same tests.
            key = json.dumps([item["title"] for item in tests[before:]], sort_keys=True)
            if key in seen:
                del tests[before:]
            else:
                seen.add(key)
                break
    return tests


def load_junit(root: Path) -> list[dict]:
    tests: list[dict] = []
    for path in walk_files(root):
        if path.suffix != ".xml" or "junit" not in path.name.lower():
            continue
        try:
            tree = ElementTree.parse(path)
        except ElementTree.ParseError:
            continue
        for case in tree.iter("testcase"):
            failure = case.find("failure")
            skipped = case.find("skipped")
            if failure is not None:
                state = "failed"
            elif skipped is not None:
                state = "pending"
            else:
                state = "passed"
            classname = case.get("classname") or ""
            name = case.get("name") or ""
            tests.append(
                {
                    "title": f"{classname} {name}".strip(),
                    "name": name,
                    "state": state,
                    "message": (failure.get("message") if failure is not None else "") or "",
                    "stack": (failure.text if failure is not None and failure.text else "") or "",
                    "spec": path.stem,
                }
            )
    return tests


CONSOLE_ERROR_DETAILS = "console-error-details"


def normalize(value: str) -> str:
    value = re.sub(r"^\d{3}\.", "", value)
    value = re.sub(r"\s*\(failed\)\s*", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"[^a-z0-9]+", " ", value.lower())
    return " ".join(value.split())


def is_show_details_shot(path: Path) -> bool:
    return CONSOLE_ERROR_DETAILS in path.stem.lower()


def numbered_prefix(path: Path) -> int | None:
    match = re.match(r"^(\d+)\.", path.name)
    return int(match.group(1)) if match else None


def find_error_details_txt(shot: Path) -> Path | None:
    """Locate error-details/<same-basename>.txt for a Show-details screenshot."""
    name = f"{shot.stem}.txt"
    for parent in shot.parents:
        candidate = parent / "error-details" / name
        if candidate.is_file():
            return candidate
    return None


def parse_error_details_txt(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    test = ""
    spec = ""
    for line in text.splitlines()[:30]:
        if line.startswith("Test:"):
            test = line[len("Test:") :].strip()
        elif line.startswith("Spec:"):
            spec = line[len("Spec:") :].strip()
    return {"test": test, "spec": spec, "body": text}


def matches_error_details_test(test: dict, details_test: str) -> bool:
    needle = normalize(details_test)
    if not needle:
        return False
    title = normalize(test.get("title") or "")
    name = normalize(test.get("name") or "")
    return needle == title or needle == name or needle in title or title in needle


def match_screenshots(test: dict, screenshots: list[Path]) -> list[Path]:
    title = normalize(test["name"] or test["title"])
    if not title:
        return []
    matched = []
    for path in screenshots:
        if is_show_details_shot(path):
            continue
        stem = normalize(path.stem)
        if title in stem or stem in title:
            matched.append(path)
    return matched


def nearest_preceding_failed_shot(shot: Path, screenshots: list[Path]) -> Path | None:
    num = numbered_prefix(shot)
    if num is None:
        return None
    best: tuple[int, Path] | None = None
    for path in screenshots:
        if path.parent != shot.parent or path == shot:
            continue
        other = numbered_prefix(path)
        if other is None or other >= num:
            continue
        if "(failed)" not in path.name.lower():
            continue
        if best is None or other > best[0]:
            best = (other, path)
    return best[1] if best else None


def attach_show_details(
    failed: list[dict],
    failure_shots: list[list[Path]],
    screenshots: list[Path],
    used_shots: set[Path],
) -> list[list[str]]:
    """Attach console-error-details screenshots (and txt bodies) to failure cards.

    Prefer matching via error-details/<basename>.txt Test:/Spec: headers.
    Fall back to the nearest preceding (failed).png in the same spec folder.
    """
    failure_details: list[list[str]] = [[] for _ in failed]
    shot_owner: dict[Path, int] = {}
    for index, shots in enumerate(failure_shots):
        for path in shots:
            shot_owner[path] = index

    for shot in screenshots:
        if shot in used_shots or not is_show_details_shot(shot):
            continue
        target: int | None = None
        details_body: str | None = None
        txt = find_error_details_txt(shot)
        if txt:
            parsed = parse_error_details_txt(txt)
            details_body = parsed["body"]
            for index, test in enumerate(failed):
                if matches_error_details_test(test, parsed["test"]):
                    target = index
                    break
        if target is None:
            prev = nearest_preceding_failed_shot(shot, screenshots)
            if prev is not None and prev in shot_owner:
                target = shot_owner[prev]
            elif prev is not None:
                for index, test in enumerate(failed):
                    if prev in match_screenshots(test, [prev]):
                        target = index
                        break
        if target is None:
            continue
        failure_shots[target].append(shot)
        used_shots.add(shot)
        shot_owner[shot] = target
        if details_body:
            failure_details[target].append(details_body)
    return failure_details


def publish_media(path: Path, media_dir: Path) -> str:
    media_dir.mkdir(parents=True, exist_ok=True)
    dest = media_dir / path.name
    if dest.exists() and dest.resolve() != path.resolve():
        dest = media_dir / f"{path.parent.name}-{path.name}"
    if not dest.exists():
        shutil.copy2(path, dest)
    return f"media/{dest.name}"


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def render(
    owner: str,
    repo: str,
    run_id: str,
    run_info: dict,
    tests: list[dict],
    screenshots: list[Path],
    videos: list[Path],
    media_dir: Path,
) -> str:
    failed = [test for test in tests if test["state"] == "failed"]
    passed = sum(1 for test in tests if test["state"] == "passed")
    pending = sum(1 for test in tests if test["state"] in {"pending", "skipped"})
    conclusion = (run_info.get("conclusion") or run_info.get("status") or "unknown").upper()
    color = {"SUCCESS": "#4caf50", "FAILURE": "#f44336", "CANCELLED": "#9e9e9e"}.get(conclusion, "#ff9800")
    url = run_info.get("html_url") or f"https://github.com/{owner}/{repo}/actions/runs/{run_id}"
    started = run_info.get("run_started_at") or run_info.get("created_at") or ""
    branch = (run_info.get("head_branch") or "")
    sha = (run_info.get("head_sha") or "")[:8]

    used_shots: set[Path] = set()
    failure_shots: list[list[Path]] = []
    for test in failed:
        shots = match_screenshots(test, screenshots)
        failure_shots.append(list(shots))
        used_shots.update(shots)
    failure_details = attach_show_details(failed, failure_shots, screenshots, used_shots)

    cards = []
    for index, test in enumerate(failed, start=1):
        shots = failure_shots[index - 1]
        details_texts = failure_details[index - 1]
        shot_html = ""
        if shots:
            imgs = []
            for path in shots:
                rel = esc(publish_media(path, media_dir))
                imgs.append(
                    f'<a class="screenshot" href="{rel}" target="_blank">'
                    f'<img alt="{esc(path.name)}" src="{rel}"></a>'
                )
            shot_html = (
                '<div class="media-section"><h4>Screenshots</h4>'
                f'<div class="screenshots">{"".join(imgs)}</div></div>'
            )
        details_html = ""
        if details_texts:
            bits = []
            for body in details_texts:
                bits.append(
                    '<details class="error-details">'
                    "<summary>Show details (console error)</summary>"
                    f"<pre>{esc(body)}</pre></details>"
                )
            details_html = "".join(bits)
        message = test["message"] or "Failed"
        stack = test["stack"]
        stack_html = ""
        if stack and stack.strip() != message.strip():
            stack_html = (
                f'<details class="stack-trace"><summary>Stack trace</summary>'
                f"<pre>{esc(stack)}</pre></details>"
            )
        cards.append(
            f"""
            <details class="failure-card">
              <summary><span class="failure-number">{index}.</span> {esc(test["title"])}</summary>
              <div class="failure-body">
                <div class="error-message"><pre>{esc(message)}</pre></div>
                {stack_html}
                {details_html}
                {shot_html}
              </div>
            </details>
            """
        )

    video_cards = []
    for path in videos:
        rel = esc(publish_media(path, media_dir))
        video_cards.append(
            f"""
            <details class="video-card">
              <summary>{esc(path.name)}</summary>
              <video controls src="{rel}"></video>
            </details>
            """
        )
    videos_html = ""
    if video_cards:
        videos_html = "<h2>Videos</h2>\n" + "\n".join(video_cards)

    unmatched = [path for path in screenshots if path not in used_shots]
    unmatched_html = ""
    if unmatched:
        bits = []
        for path in unmatched:
            rel = esc(publish_media(path, media_dir))
            bits.append(
                f'<a class="screenshot" href="{rel}" target="_blank">'
                f'<img alt="{esc(path.name)}" src="{rel}"></a>'
            )
        unmatched_html = '<h2>Unmatched screenshots</h2><div class="screenshots">' + "\n".join(bits) + "</div>"

    body = "\n".join(cards) or "<p>No failed tests were found in the Cypress report.</p>"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hot Cluster E2E {esc(run_id)}</title>
<style>
:root {{
  --bg: #121417; --surface: #1e2126; --text: #e8eaed; --muted: #9aa0a6;
  --failure: #f44336; --ok: #4caf50; --border: #333;
}}
body {{ margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }}
header, main {{ max-width: 1920px; margin: 0 auto; padding: 1.5rem; }}
a {{ color: #8ab4f8; }}
.badge {{ display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; color: white; background: {color}; }}
.counts {{ display: flex; gap: 1rem; margin: 1rem 0 1.5rem; }}
.count {{ background: var(--surface); border-radius: 8px; padding: 0.8rem 1.2rem; min-width: 6rem; }}
.count b {{ display: block; font-size: 1.4rem; }}
.toolbar {{ display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }}
.toolbar h2 {{ margin: 0; }}
.toggle-btn {{
  background: var(--surface); border: 1px solid var(--border); color: var(--muted);
  padding: 0.35rem 0.7rem; border-radius: 4px; cursor: pointer;
}}
.toggle-btn:hover {{ color: var(--text); }}
.failure-card, .video-card {{
  background: var(--surface); border-left: 3px solid var(--failure); border-radius: 8px;
  margin-bottom: 1.2rem;
}}
.video-card {{ border-left-color: #555; }}
.failure-card > summary, .video-card > summary {{
  padding: 1rem 1.2rem; cursor: pointer; list-style: none; font-size: 1.05rem; font-weight: 600;
}}
.failure-card > summary::-webkit-details-marker, .video-card > summary::-webkit-details-marker {{ display: none; }}
.failure-card > summary::before, .video-card > summary::before {{ content: "\\25B6  "; font-size: 0.7rem; color: var(--muted); }}
.failure-card[open] > summary::before, .video-card[open] > summary::before {{ content: "\\25BC  "; }}
.failure-body {{ padding: 0 1.2rem 1.2rem; }}
.video-card video {{
  width: 100%; margin: 0 1.2rem 1.2rem; max-width: calc(100% - 2.4rem);
  border-radius: 6px; border: 1px solid var(--border);
}}
.failure-number {{ color: var(--muted); margin-right: 0.3rem; }}
.error-message pre, .stack-trace pre {{
  background: #1a1a1a; color: #ff8a80; padding: 1rem; border-radius: 6px;
  white-space: pre-wrap; word-break: break-word; overflow-x: auto;
}}
.stack-trace pre {{ color: #ccc; max-height: 400px; overflow-y: auto; }}
.error-details {{ margin: 0.75rem 0; }}
.error-details pre {{
  background: #1a1a1a; color: #ccc; padding: 1rem; border-radius: 6px;
  white-space: pre-wrap; word-break: break-word; overflow-x: auto;
  max-height: 400px; overflow-y: auto;
}}
.screenshots {{ display: flex; flex-direction: column; gap: 0.75rem; }}
.screenshot {{ display: block; }}
.screenshot img {{ width: 100%; height: auto; border-radius: 6px; border: 1px solid var(--border); }}
.file-name {{ color: var(--muted); font-size: 0.85rem; margin-top: 0.3rem; }}
h1, h2 {{ font-weight: 600; }}
h2 {{ font-size: 1.05rem; }}
</style>
</head>
<body>
<header>
  <h1>Hot Cluster E2E <span class="badge">{esc(conclusion)}</span></h1>
  <p><a href="{esc(url)}">{esc(owner)}/{esc(repo)} #{esc(run_id)}</a></p>
  <p>{esc(branch)} {esc(sha)} {esc(started)}</p>
  <div class="counts">
    <div class="count"><b>{passed}</b>passed</div>
    <div class="count"><b>{len(failed)}</b>failed</div>
    <div class="count"><b>{pending}</b>pending</div>
  </div>
</header>
<main>
  <div class="toolbar">
    <h2>Test failures</h2>
    <button class="toggle-btn" type="button" onclick="toggleAll(true)">Expand all</button>
    <button class="toggle-btn" type="button" onclick="toggleAll(false)">Collapse all</button>
  </div>
{body}
{videos_html}
{unmatched_html}
</main>
<script>
function toggleAll(expand) {{
  document.querySelectorAll("details.failure-card, details.video-card").forEach(function(item) {{
    item.open = expand;
  }});
}}
</script>
</body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("run_url")
    parser.add_argument(
        "--out",
        default=str(Path.home() / "hot-cluster-reports"),
        help="Directory for the report (default: ~/hot-cluster-reports)",
    )
    args = parser.parse_args()
    owner, repo, run_id = parse_run_url(args.run_url)
    out_dir = Path(args.out) / run_id
    artifact_dir = out_dir / "artifact"
    if artifact_dir.exists():
        subprocess.run(["rm", "-rf", str(artifact_dir)], check=True)
    download_cypress_artifact(owner, repo, run_id, artifact_dir)
    run_info = gh_json(f"repos/{owner}/{repo}/actions/runs/{run_id}")
    tests = load_mochawesome(artifact_dir) or load_junit(artifact_dir)
    files = walk_files(artifact_dir)
    screenshots = [path for path in files if path.suffix.lower() in IMAGE_EXT]
    videos = [path for path in files if path.suffix.lower() in VIDEO_EXT]
    report = render(owner, repo, run_id, run_info, tests, screenshots, videos, out_dir / "media")
    report_path = out_dir / "failure-report.html"
    report_path.write_text(report, encoding="utf-8")
    print(report_path)
    opener = "open" if sys.platform == "darwin" else "xdg-open"
    subprocess.run([opener, str(report_path)], check=False)


if __name__ == "__main__":
    main()
