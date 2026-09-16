---
name: hot-cluster-report
description: >-
  Diagnose hot-cluster E2E test failures from GitHub Actions runs. Downloads
  test artifacts, generates an HTML failure report with screenshots, and opens
  it in the browser. Use when the user provides a GitHub Actions run URL,
  says "diagnose run", "check e2e results", "hot cluster report", or asks
  about a failed hot-cluster E2E workflow run.
---

# Hot-Cluster E2E Failure Report

## Input

The user provides a GitHub Actions run URL like:
`https://github.com/lkladnit/networking-console-plugin/actions/runs/36306233879`

Extract `OWNER/REPO` and `RUN_ID` from the URL.

## Workflow

### 1. Get run status and identify failures

```bash
gh run view RUN_ID --repo OWNER/REPO --json status,conclusion,jobs \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Run: {d[\"status\"]}  {d.get(\"conclusion\",\"—\")}')
for j in d.get('jobs',[]):
    print(f'{j[\"status\"]:12} {j.get(\"conclusion\",\"—\"):12} {j[\"name\"]}')
    for s in j.get('steps',[]):
        if s.get('conclusion'):
            mark = '✓' if s['conclusion'] == 'success' else '✗' if s['conclusion'] == 'failure' else '—'
            print(f'  {mark} {s[\"name\"]}')
"
```

If the run is still in progress, report status and stop.

### 2. Get failed step logs

```bash
gh run view RUN_ID --repo OWNER/REPO --log-failed 2>&1
```

Extract Cypress test results: look for lines with `passing`, `failing`, `✓`, `✗`,
`AssertionError`, `CypressError`, `Timed out`.

### 3. Download test artifacts

```bash
ARTIFACTS_DIR="ui-tests-cy/ci-hot-cluster-e2e"
rm -rf "${ARTIFACTS_DIR}"
mkdir -p "${ARTIFACTS_DIR}"

# Download cypress-results artifact
gh run download RUN_ID --repo OWNER/REPO \
  --name "cypress-results-RUN_ID" \
  --dir "${ARTIFACTS_DIR}/cypress-results" 2>/dev/null || echo "No cypress-results artifact"

# Download diagnostics artifact
gh run download RUN_ID --repo OWNER/REPO \
  --name "e2e-ci-diagnostics-RUN_ID" \
  --dir "${ARTIFACTS_DIR}/diagnostics" 2>/dev/null || echo "No diagnostics artifact"
```

### 4. Inspect downloaded artifacts

```bash
find "${ARTIFACTS_DIR}" -type f | sort
```

Look for:
- `screenshots/` — Cypress failure screenshots (PNG)
- `cypress-report.html` — Mochawesome report if generated
- `pod-logs/console.log` — console pod logs
- `pod-logs/networking-plugin.log` — plugin pod logs
- `cluster/` — node info, events, pod status

### 5. Parse console/plugin pod logs for errors

```bash
# Console errors (403s, proxy failures, plugin load issues)
grep -i "error\|failed\|403\|502" "${ARTIFACTS_DIR}/diagnostics/pod-logs/console.log" 2>/dev/null | tail -20

# Plugin serving issues
grep -i "error\|404\|502" "${ARTIFACTS_DIR}/diagnostics/pod-logs/networking-plugin.log" 2>/dev/null | tail -10
```

### 6. Generate HTML failure report

Write a self-contained HTML file to `${ARTIFACTS_DIR}/failure-report.html`.

Use this template structure:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hot-Cluster E2E Report — Run RUN_ID</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background: #1a1a2e; color: #e0e0e0; margin: 0; padding: 20px; }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { color: #64ffda; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0; }
  .card { background: #16213e; border-radius: 8px; padding: 16px; flex: 1; min-width: 200px; }
  .card.pass { border-left: 4px solid #4caf50; }
  .card.fail { border-left: 4px solid #f44336; }
  .card.skip { border-left: 4px solid #ff9800; }
  .card h3 { margin: 0 0 8px; }
  .card .count { font-size: 2em; font-weight: bold; }
  .failure { background: #16213e; border-radius: 8px; padding: 16px; margin: 12px 0; border-left: 4px solid #f44336; }
  .failure h3 { color: #ff6b6b; margin: 0 0 8px; }
  .error-msg { background: #0f3460; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 13px; white-space: pre-wrap; overflow-x: auto; }
  .screenshot { max-width: 100%; border-radius: 4px; margin: 12px 0; cursor: pointer; }
  .screenshot:hover { opacity: 0.9; }
  details { margin: 8px 0; }
  summary { cursor: pointer; color: #64ffda; }
  a { color: #64ffda; }
  .step { padding: 4px 0; }
  .step .pass { color: #4caf50; }
  .step .fail { color: #f44336; }
  .log-section { background: #0f3460; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap; overflow-x: auto; max-height: 400px; overflow-y: auto; margin: 8px 0; }
</style>
</head>
<body>
<div class="container">
  <h1>🔴 Hot-Cluster E2E Report</h1>
  <p>Run: <a href="RUN_URL">RUN_ID</a> | Branch: BRANCH | Date: DATE</p>

  <!-- Summary cards: passing / failing / skipped counts -->
  <div class="summary">
    <div class="card pass"><h3>Passing</h3><div class="count">N</div></div>
    <div class="card fail"><h3>Failing</h3><div class="count">N</div></div>
    <div class="card skip"><h3>Skipped</h3><div class="count">N</div></div>
  </div>

  <!-- Workflow steps -->
  <h2>Workflow Steps</h2>
  <!-- For each step: ✓/✗ + name -->

  <!-- Per-failure cards -->
  <h2>Test Failures</h2>
  <!-- For each failure:
    <div class="failure">
      <h3>Test name</h3>
      <div class="error-msg">Error message / assertion</div>
      <img class="screenshot" src="data:image/png;base64,..." /> (if screenshot exists)
      <details><summary>Stack trace</summary><div class="log-section">...</div></details>
    </div>
  -->

  <!-- Console pod logs (if errors found) -->
  <h2>Console Pod Logs</h2>
  <details><summary>Show logs</summary><div class="log-section">LOG_CONTENT</div></details>

  <!-- Plugin pod logs -->
  <h2>Plugin Pod Logs</h2>
  <details><summary>Show logs</summary><div class="log-section">LOG_CONTENT</div></details>
</div>
</body>
</html>
```

**Screenshot embedding**: For each PNG in `screenshots/`, read with base64 and embed as
`<img src="data:image/png;base64,ENCODED" />`. Match to failures by filename (Cypress names
screenshots after the test that failed).

**Populate** counts, steps, failures, and logs from the data gathered in steps 1-5.
Write the complete HTML to `${ARTIFACTS_DIR}/failure-report.html`.

### 7. Open in browser

```bash
open "${ARTIFACTS_DIR}/failure-report.html"  # macOS
```

## Output summary

After opening the report, print a concise summary:

```
Run RUN_ID: N passing, N failing, N skipped
Failures:
  ✗ test name — error summary
  ✗ test name — error summary
Report: ui-tests-cy/ci-hot-cluster-e2e/failure-report.html
```

## Error handling

- If no artifacts exist (run passed or artifacts expired): report "No artifacts to download" and show only the step summary.
- If run is still in progress: show current status and stop.
- If run was cancelled: note cancellation reason and show completed steps.
