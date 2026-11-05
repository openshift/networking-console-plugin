# Jenkins Fix Loop (Cypress): Autonomous Fix-Retest-Merge Cycle

Orchestrate the full fix lifecycle: diagnose failures → fix → push to fork → retest on dev Jenkins → repeat until green → create Jira task → create MR → merge. Runs without stopping until complete or a blocking issue requires human attention.

## Input

```
/jenkins-fix-loop-cy <jenkins-job-url> --cluster=<name> [--password=<kubeadmin-password>]
```

- `<jenkins-job-url>` — Jenkins build or job URL (e.g. `.../test-kubevirt-console-t2-cnv-4.21-ocs/86/`)
- `--cluster` — name of the test cluster to run fixes against (e.g. `uit-414-0623`)
- `--password` — optional kubeadmin password for that cluster. **Sensitive: never commit it, never write it to `.env`, logs, reports or test fixtures.** If omitted, the agent asks the user for it before the first `oc login`; it is kept in the shell environment for that session only.

### Auto-derived (no user input needed)

| Value                     | Source                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `RELEASE`                 | regex `cnv-(\d+\.\d+)` on job URL                                          |
| `TIER`                    | regex `t(\d)` on job URL                                                   |
| `OPENSHIFT_PASSWORD`      | `--password` argument, otherwise asked from the user (never stored)        |
| `CLUSTER_DOMAIN`          | constant: `rhos-psi.cnv-qe.rhood.us`                                       |
| `CLUSTER_URL`             | `https://api.${CLUSTER_NAME}.${CLUSTER_DOMAIN}:6443`                       |
| `WEB_CONSOLE_URL`         | `https://console-openshift-console.apps.${CLUSTER_NAME}.${CLUSTER_DOMAIN}` |
| `FIX_LOOP_JOB`            | `FIX_LOOP_JOB_CY` from `.env` (e.g. `dev-test-kubevirt-console`)           |
| `GIT_CONSOLE_REPO_BRANCH` | build param from failing job                                               |
| `GIT_CONSOLE_REPO_URL`    | build param from failing job                                               |
| `STORAGECLASS`            | build param from failing job                                               |
| `ENTRY_COMMAND`           | build param from failing job                                               |
| `CNV_QE_AUTO_BRANCH`      | build param from failing job                                               |

### Examples

```
/jenkins-fix-loop-cy https://jenkins-csb-cnvqe-main.dno.corp.redhat.com/job/test-kubevirt-console-t1-cnv-4.14-gating/ --cluster=uit-414-0623
/jenkins-fix-loop-cy https://jenkins-csb-cnvqe-main.dno.corp.redhat.com/job/test-kubevirt-console-t2-cnv-4.21-ocs/86/ --cluster=uit-421-0620
```

## Prerequisites

1. **Git remotes** in `~/dev/kubevirt-ui`: `origin` (upstream GitLab), `${USER}` (personal fork)
2. **VPN** connected (required for Jenkins API, cluster access)
3. **MCP servers**: `user-jenkins-failure-diagnosis`, `user-reportportal`, `user-rootcoz`, `user-jira`
4. **`oc` CLI** installed and in PATH
5. **Cluster credentials** — the kubeadmin password is supplied by the user (`--password`) or asked for on first use; it is never read from or written to the repo

> Credentials policy: the password exists only in the environment of the running session. Do not persist it in `.env`, shell history, reports, HTML artifacts, Jira/MR text or committed files.

---

If something is missing → **ALERT: "Not ready"**.

## Workflow

### Phase 0: Parse and Validate

1. **Extract release** from URL via regex `cnv-(\d+\.\d+)`.
2. **Extract tier** from URL via regex `t(\d)` (e.g. `t2` → tier 2).
3. **Fetch build info** via `get_build_info(job_url)` — extract:
   - `GIT_CONSOLE_REPO_BRANCH`, `GIT_CONSOLE_REPO_URL`, `STORAGECLASS`, `ENTRY_COMMAND`, `CNV_QE_AUTO_BRANCH`
4. **Derive remaining values** from `--cluster` flag + constants:
   - `CLUSTER_NAME` = `--cluster`
   - `CLUSTER_DOMAIN` = `rhos-psi.cnv-qe.rhood.us`
   - `CLUSTER_URL` = `https://api.${CLUSTER_NAME}.${CLUSTER_DOMAIN}:6443`
   - `WEB_CONSOLE_URL` = `https://console-openshift-console.apps.${CLUSTER_NAME}.${CLUSTER_DOMAIN}`
   - `FIX_LOOP_JOB`:
     ```bash
     FIX_LOOP_JOB=$(grep ^FIX_LOOP_JOB_CY ~/dev/kubevirt-ui/.env | cut -d= -f2-)
     ```
     If not set → **ALERT: "FIX_LOOP_JOB_CY not set in .env — add `FIX_LOOP_JOB_CY=dev-test-kubevirt-console`"**
   - `OPENSHIFT_PASSWORD`:
     - from the `--password` argument when given, otherwise **ask the user once**: "kubeadmin password for ${CLUSTER_NAME}?"
     - export it for the session only (`export OPENSHIFT_PASSWORD=...`) and never echo it back, log it, or write it to a file
     - if neither the argument nor the user answer is available → **ALERT: "kubeadmin password required for ${CLUSTER_NAME}"**
5. **Verify cluster/release match**: the cluster name should contain the release digits (e.g. `uit-414` matches `4.14`). If mismatch → **ALERT**.
6. **Pre-flight cluster check**:

```bash
oc login "$CLUSTER_URL" -u kubeadmin -p "$OPENSHIFT_PASSWORD" --insecure-skip-tls-verify
```

If login fails → **ALERT: "Cluster unreachable or password wrong"**.

7. **Resolve git user**: `USER=$(git config user.email | cut -d@ -f1)` (e.g. `lkladnit`).

### Phase 1: Branch Setup

```
BRANCH=fix-${RELEASE}-t${TIER}
WORKTREE_DIR=/tmp/kubevirt-ui-${BRANCH}
BASE_REPO=~/dev/kubevirt-ui
```

1. Fetch upstream: `git -C ${BASE_REPO} fetch origin release-${RELEASE}`
2. Create worktree on a new branch from upstream:
   ```bash
   git -C ${BASE_REPO} worktree add ${WORKTREE_DIR} -b ${BRANCH} origin/release-${RELEASE}
   ```
   If the branch already exists locally → add `--force` and reset:
   ```bash
   git -C ${BASE_REPO} worktree add --force ${WORKTREE_DIR} ${BRANCH}
   git -C ${WORKTREE_DIR} reset --hard origin/release-${RELEASE}
   ```
3. All subsequent file edits, git operations, and eslint runs use `${WORKTREE_DIR}`.
4. Push worktree branch to fork: `git -C ${WORKTREE_DIR} push -u ${USER} ${BRANCH}`
5. If push fails → **ALERT: "Can't push to `${USER}/${BRANCH}`"**.

> **Why worktree:** isolates this fix loop from any concurrent work in `~/dev/kubevirt-ui`.
> Multiple loops can run in parallel, each in its own `/tmp/kubevirt-ui-fix-X.XX-tN` directory.

### Phase 2: Fix-Retest Loop (MAIN LOOP)

```
STATE:
  current_job_url = <input URL>
  iteration = 0
  max_iterations = 5
  prev_failure_signatures = []

LOOP:
  iteration += 1
  if iteration > max_iterations → ALERT: "Max iterations reached" → STOP

  --- Step 2a: Fix ---
  Invoke /jenkins-fix-cycle-cy with:
    - current_job_url (testReport mode)
    - --branch=${BRANCH}
    - --repo-dir=${WORKTREE_DIR}

  Capture the output summary:
    - If ALL failures are "NOT ACTIONABLE" (infra/product) → break to Phase 3
    - If no fixable failures remain → break to Phase 3
    - Record current failure signatures (test names + error hashes)

  --- Step 2b: Check for stuck loop ---
  Compare current failure signatures with prev_failure_signatures.
  If identical for 3 consecutive iterations → ALERT: "Fix loop stuck" → STOP
  Update prev_failure_signatures.

  --- Step 2c: Commit + Push ---
  1. Run lint on cypress/ files in worktree:
     cd ${WORKTREE_DIR} && npx eslint cypress/ --fix 2>/dev/null; npx eslint cypress/
  2. Stage + squash commit:
     git -C ${WORKTREE_DIR} add -A cypress/
     git -C ${WORKTREE_DIR} commit -m "fix(cypress): stabilize tier${TIER} on release-${RELEASE} [iteration ${iteration}]"
  3. Force-push to fork:
     git -C ${WORKTREE_DIR} push ${USER} ${BRANCH} --force-with-lease

  --- Step 2d: Trigger Retest ---
  Trigger ${FIX_LOOP_JOB} via Jenkins API with parameters:
    - GIT_CONSOLE_REPO_URL: fork URL (https://gitlab.cee.redhat.com/${USER}/kubevirt-ui.git)
    - GIT_CONSOLE_REPO_BRANCH: fix-${RELEASE}-t${TIER}
    - CLUSTER_NAME: from .env
    - CLUSTER_DOMAIN: from .env
    - ENTRY_COMMAND: ./test-cypress.sh -s 'tests/tier${TIER}/<failing-specs-glob>'
    - STORAGECLASS: from original job metadata

  Record the build queue item / build number.

  --- Step 2e: Poll Until Complete ---
  Poll every 180s using get_build_info MCP tool:
    - Timeout: 60 minutes max
    - If poll returns error 3x consecutive → backoff (120s, 240s)
    - If poll fails 5x total → ALERT: "Jenkins unreachable" → STOP
    - If build result is ABORTED → ALERT: "Build was aborted" → STOP

  Double-check: after job completes, wait 30s and re-fetch to confirm
  (Jenkins sometimes reports incomplete data immediately after finish).

  --- Step 2f: Analyze Results ---
  Fetch test report from new build URL.
  If all tests pass → break to Phase 3
  If failures found → set current_job_url = new build URL; CONTINUE LOOP
```

### Phase 3: Full Tier Retest

When targeted specs pass, validate the full tier hasn't regressed:

1. Trigger `${FIX_LOOP_JOB}` with the **full tier entry command** from the original job (e.g. `./tier2-cypress.sh` or `./test-cypress.sh -s 'tests/tier1/*.cy.ts'`).
2. Same branch + cluster parameters as Phase 2d.
3. Poll until complete (same logic as Phase 2e).
4. Analyze results:

- **All pass** → proceed to Phase 4
- **Only infra/system-issue failures** (classified by RP/RootCoz) → proceed to Phase 4, note them
- **New test failures** → return to Phase 2 with this build's URL as `current_job_url`

### Phase 4: Jira Task

1. **Squash all commits** into one clean commit in the worktree:

```bash
git -C ${WORKTREE_DIR} reset --soft origin/release-${RELEASE}
git -C ${WORKTREE_DIR} commit -m "fix(cypress): stabilize tier${TIER} on release-${RELEASE}"
git -C ${WORKTREE_DIR} push ${USER} ${BRANCH} --force-with-lease
```

1. **Create Jira task** via `user-jira` MCP:

- Project: `CNV`
- Type: `Task`
- Summary: `[e2e] [${original_job_name}] failures`
- Description: ADF with job links, cluster info, root causes found, fix summary, verified build link
- Labels: `["e2e", "kubevirt-ui", "tier${TIER}"]`
- Component: `CNV User Interface`
- Assign to `${USER}` (resolve account ID via `search_users`)

2. **Transition through states**: New → In Progress → Dev Complete → Testing

- Use `get_transitions` + `transition_issue` for each step

3. Store the Jira key (e.g. `CNV-XXXXX`).

### Phase 5: MR Creation and Merge

1. **Create MR** on GitLab via `plugin-gitlab-GitLab` MCP or `git push` + manual URL:

- Source: `${USER}/kubevirt-ui:fix-${RELEASE}-t${TIER}`
- Target: `cnv-qe/kubevirt-ui:release-${RELEASE}`
- Title: `CNV-XXXXX: fix(cypress) - stabilize tier${TIER} on release-${RELEASE}`
- Assignee: `${USER}`
- Reviewer: `${USER}`
- Description:

```
## Summary

Fixes Cypress tier${TIER} test failures on release-${RELEASE}.

## Jira

https://redhat.atlassian.net/browse/CNV-XXXXX

## Changes

- [bullet points of what was fixed]

## Verification

Passed: ${FIX_LOOP_JOB} #NNN (full tier)
https://jenkins-csb-cnvqe-main.dno.corp.redhat.com/job/dev-test-kubevirt-console/NNN/
```

1. **Wait for CI pipeline** (GitLab `run-eslint` job on the MR).
2. **If lint fails**: read the pipeline log, fix issues, commit, push. Repeat until pipeline passes.
3. **Merge the MR** (fast-forward or merge commit per repo settings).
4. **Add** MR link to description of `CNV-XXXXX`.

### Phase 6: Jira Close

1. Add final comment to Jira:

> Fix merged in MR !XXXX. Verified on dev-test-kubevirt-console #NNN (full tier pass).
> [https://gitlab.cee.redhat.com/cnv-qe/kubevirt-ui/-/merge_requests/XXXX](https://gitlab.cee.redhat.com/cnv-qe/kubevirt-ui/-/merge_requests/XXXX)

2. Transition: Testing → Closed (resolution: Done).
3. **Remove worktree**:
   ```bash
   git -C ~/dev/kubevirt-ui worktree remove ${WORKTREE_DIR} --force
   ```

---

## Error Handling and Alerts

| Condition                                   | Action                                               |
| ------------------------------------------- | ---------------------------------------------------- |
| `oc login` fails                            | ALERT: "Cluster unreachable or password wrong"       |
| `.env` cluster/release mismatch             | ALERT: "Cluster {name} does not match release {ver}" |
| Fix loop stuck (same failures 3 iterations) | ALERT: "Fix loop stuck — manual intervention needed" |
| Max iterations (5) reached                  | ALERT: "Max iterations — giving up"                  |
| Jenkins poll fails 5x                       | ALERT: "Jenkins unreachable"                         |
| Build aborted externally                    | ALERT: "Build was aborted"                           |
| Full tier introduces new failures           | Return to Phase 2 (not an alert unless it loops 3x)  |
| MR pipeline lint fails 3x                   | ALERT: "Cannot pass lint — manual fix needed"        |

### ALERT Mechanism

When an ALERT fires:

1. Print the error in **bold red** to the chat output
2. Play terminal bell 5 times:

```bash
for i in {1..5}; do printf '\a'; sleep 1; done
```

1. **Stop all execution** and wait for user input
2. Present recovery options via AskQuestion tool

---

## Key Design Decisions

- **Fork remote:** `${USER}` (derived from `git config user.email`)
- **Dev job:** `FIX_LOOP_JOB_CY` from `.env` (e.g. `dev-test-kubevirt-console`)
- **Inner command:** delegates to `/jenkins-fix-cycle-cy` for analysis + fix logic
- **Commit strategy:** multiple iterations during loop, final squash before PR
- **Polling:** Jenkins API via `get_build_info` MCP tool, 180s interval, exponential backoff on failure
- **Retest scope:** failing specs only in Phase 2; full tier in Phase 3
- **Loop guard:** max 5 iterations; stuck detection (same signatures 3x)
- **RP/RC integration:** via `/jenkins-fix-cycle-cy` Phase 0.5 — automatic classification

---

## Dependencies

| Dependency                           | Purpose                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `/jenkins-fix-cycle-cy`              | Analysis + fix logic (inner command)                                                   |
| `user-jenkins-failure-diagnosis` MCP | Jenkins API, test reports, build info, trigger builds                                  |
| `user-rootcoz` MCP                   | AI classification, code fix hints, RP push                                             |
| `user-reportportal` MCP              | Read predictions, write defect types                                                   |
| `user-jira` MCP                      | Create/transition/comment Jira tasks                                                   |
| `plugin-gitlab-GitLab` MCP           | Create MR, check pipeline status                                                       |
| `.env`                               | `FIX_LOOP_JOB_CY`, `CLUSTER_URL`, `CLUSTER_NAME`, `CLUSTER_DOMAIN` (never credentials) |
| Git remotes                          | `origin` (upstream), `${USER}` (fork)                                                  |

---

## Related commands

| Command                 | Use when                                                   |
| ----------------------- | ---------------------------------------------------------- |
| `/jenkins-fix-cycle-cy` | Single fix cycle without the retest loop (used internally) |
| `/jenkins-fix-cycle-pw` | Same for Playwright specs                                  |
| `/commit-cnv-tests`     | Manual commit workflow                                     |
