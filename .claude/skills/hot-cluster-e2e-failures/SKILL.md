---
name: hot-cluster-e2e-failures
description: >-
  Build a self-contained HTML failure report for a Hot Cluster E2E GitHub
  Actions run. Use when the user says /hot-cluster-e2e-failures and gives a
  workflow run URL such as
  https://github.com/lkladnit/networking-console-plugin/actions/runs/40321544692.
disable-model-invocation: true
---

# Hot Cluster E2E failures

Turn a GitHub Actions Hot Cluster E2E run into a self-contained HTML report with error descriptions, stack traces, screenshots, and videos, then open it in the default browser.

## Workflow

The user passes one argument: the workflow run URL.

```text
/hot-cluster-e2e-failures https://github.com/<owner>/<repo>/actions/runs/<run_id>
```

Run:

```bash
python3 .cursor/skills/hot-cluster-e2e-failures/scripts/report.py "<run-url>"
```

The script:

1. Reads `<owner>`, `<repo>`, and `<run_id>` from the URL.
2. Downloads the artifact whose name starts with `cypress-results` (`gh run download`). That is the Artifacts table entry `cypress-results-<run_id>`.
3. Unpacks it and reads the Cypress mochawesome JSON, falling back to JUnit XML.
4. Matches screenshots to failed tests by title, and the spec video to those tests.
5. Copies screenshots and videos into `~/hot-cluster-reports/<run_id>/media/` and writes `failure-report.html` next to that folder. The HTML links to those files. It does not embed them as `data:` URLs.
6. Opens that file in the default browser (`open` on macOS).

Requires the `gh` CLI already authenticated for the repository. Do not commit the report or the unpacked artifact.

## Report contents

- Run header: result, branch, commit, link to the Actions run
- Passed / failed / pending counts
- Expand all / Collapse all buttons
- One collapsible card per failed test: error message, stack trace, matched screenshots
- Show-details / `console-error-details` screenshots (from the Cypress TypeError modal
  flow) are attached to the related failure card. Matching prefers
  `error-details/<same-basename>.txt` (`Test:` / `Spec:` headers); otherwise the
  nearest preceding `(failed).png` in the same spec folder. Matching txt content is
  surfaced on the card when present. Once attached, these shots are not listed under
  Unmatched.
- A separate Videos section. Videos are not placed inside a failure card.
- Unmatched screenshots in a separate section (truly orphan media only)
