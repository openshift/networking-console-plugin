---
name: jenkins-failure-diagnosis
description: Diagnose failures in Jenkins CI/CD pipelines and generate HTML reports with errors, stack traces, screenshots, and videos. Use when the user provides a Jenkins job URL, asks to analyze a failed build, or wants a failure report from Jenkins.
---

# Jenkins Failure Diagnosis

Analyze failed Jenkins builds and produce self-contained HTML reports with error descriptions, stack traces, screenshots, and videos.

## Prerequisites

This skill requires the **jenkins-failure-diagnosis** MCP server. See [setup.md](setup.md) for installation and Cursor configuration.

**Skill location in this repo:** `.claude/skills/jenkins-e2e-cy-failures` (use this path as `<skill-dir>` below).

The MCP server must have these env vars set:

- `JENKINS_URL` — base URL of the Jenkins instance
- `JENKINS_USER` — username for authentication
- `JENKINS_TOKEN` — API token (generate at `$JENKINS_URL/user/<you>/configure`)
- `JENKINS_VERIFY_SSL` — optional, set to `false` for self-signed certs

Optional RootCoz integration (embeds AI analysis in the HTML report):

- Uses the same env vars as the `user-rootcoz` MCP server — copy `ROOTCOZ_URL`, `ROOTCOZ_API_KEY`, and `ROOTCOZ_VERIFY_SSL` into the `jenkins-failure-diagnosis` block in `~/.cursor/mcp.json` (each MCP server runs in its own process and does not inherit another server's env)

## Arguments

| Argument           | Required | Notes                                                                                                               |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `job_url`          | yes      | Jenkins job or build URL, passed to `generate_failure_report`                                                       |
| `cluster_password` | no       | kubeadmin password, **typed by the user in the conversation** when the agent needs to log into the cluster for them |

`cluster_password` is used only for the lifetime of the request (for example an `oc login` the
agent runs on the user's behalf). It is never written to the HTML report, to
`~/jenkins-reports/`, to `.env`, to fixtures, or back into the conversation. The MCP server does
not fetch, store or echo the kubeadmin password at all — it has no code path that reads it from
build artifacts.

If a report recipient needs cluster credentials, read them locally on the machine that has the
cluster's auth directory (`auth/kubeadmin-password`) or ask the user to supply them.

## Workflow

When the user provides a Jenkins job URL, diagnose that build.

### Full Report (default)

Call the `generate_failure_report` MCP tool with the job URL. This single call:

1. Fetches build metadata and test report via Jenkins API
2. Downloads and extracts the artifact archive
3. Matches screenshots and videos to failed tests by name
4. Fetches RootCoz analysis when configured (Key Takeaway + peer debate)
5. Generates a self-contained HTML file with all failures, media embedded as base64

Report is saved to `~/jenkins-reports/` by default. After generation, the MCP server runs macOS `open` (or the system default browser elsewhere) on `failure-report.html` **only when tests actually ran**. If Cypress/tests never ran (0 total tests, empty/missing test report, or console signals such as `spec-not-found` / `Tests were not running properly - No Results`), the report is still saved but **not** auto-opened. **Restart the MCP server** in Cursor if you updated `server.py` and auto-open behavior does not match.

### Step-by-Step Investigation

For deeper analysis, use individual MCP tools:

1. `get_build_info` — build status, duration, agent, artifact list
2. `get_test_report` — all failed tests with error messages and stack traces
3. `get_console_log` — raw console output for pipeline-level failures
4. `download_artifacts` — extract logs, screenshots, videos for inspection

Then apply the diagnosis workflow below before generating the report.

## Diagnosis Logic

### Classify the failure

| Category            | Signals                                          |
| ------------------- | ------------------------------------------------ |
| **Test**            | Assertion failures, timeouts, flaky tests        |
| **Build**           | Compilation errors, dependency resolution        |
| **Infrastructure**  | Agent offline, OOM, disk full, Docker issues     |
| **Pipeline Config** | Jenkinsfile syntax, missing credentials, bad DSL |
| **Permissions**     | 401/403, token expired, SSH key mismatch         |

### Analyze test failures

- Compare error messages to known patterns (see [common-errors.md](common-errors.md))
- Check if stack trace points to test code vs application code
- Flag potential flaky tests: `SocketTimeoutException`, `ConnectionRefused`, or tests that pass on retry
- Look for environment-specific issues: DB not started, port conflicts

### Match media to failures

Screenshots and videos are matched to failures by comparing file names against test class and method names. Unmatched media is shown in a separate section of the report.

## Report Contents

The HTML report includes:

- Build summary header with result badge, duration, Jenkins link
- **RootCoz Analysis** section:
  - Expandable cards per failure group when analysis exists (classification badge, Key Takeaway preview, Peer Analysis rounds)
  - **No analysis found.** when no RootCoz data exists for the build
  - Link to open the full analysis in RootCoz (when available)
- Failure count summary cards
- Per-failure cards with:
  - Test class and method name
  - Error message (highlighted)
  - Expandable stack trace
  - Matched screenshots (embedded)
  - Matched videos (embedded with controls)
- ReportPortal defect-type selectors: choosing a type and pressing save **copies an agent command**
  (`update_defect_type rp_url=... item_id=... issue_type=...`) to the clipboard; the agent applies
  it through the MCP tool, so no ReportPortal token is embedded in the HTML
- Section for unmatched media artifacts
- Dark theme, responsive layout, self-contained (no external dependencies, no local server, no credentials)

## Additional Resources

- For common error patterns and fixes, see [common-errors.md](common-errors.md)
- For MCP setup instructions, see [setup.md](setup.md)
