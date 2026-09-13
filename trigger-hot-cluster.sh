#!/usr/bin/env bash
#
# Trigger the hot-cluster E2E workflow on a fork branch.
#
# Usage:
#   ./trigger-hot-cluster.sh                    # auto-detect branch + owner
#   ./trigger-hot-cluster.sh my-branch          # explicit branch, auto owner
#   ./trigger-hot-cluster.sh my-branch lkladnit # explicit both
#
set -euo pipefail

# Detect current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
BRANCH="${1:-${CURRENT_BRANCH}}"

# Detect fork owner from the remote tracking the branch
if [[ -z "${2:-}" ]]; then
  REMOTE=$(git config "branch.${BRANCH}.remote" 2>/dev/null || git config "branch.${CURRENT_BRANCH}.remote" 2>/dev/null || echo "origin")
  REMOTE_URL=$(git remote get-url "${REMOTE}" 2>/dev/null || echo "")
  OWNER=$(echo "${REMOTE_URL}" | sed -E 's|.*/([^/]+)/[^/]+(.git)?$|\1|')
else
  OWNER="$2"
fi
REPO="${OWNER}/networking-console-plugin"
TEST_SPEC="tests/all.cy.ts"

echo "Repo:    ${REPO}"
echo "Branch:  ${BRANCH}"
echo "Spec:    ${TEST_SPEC}"
echo ""

# Save current default branch
ORIGINAL_DEFAULT=$(gh api "repos/${REPO}" -q '.default_branch')

# Temporarily set branch as default (required for workflow_dispatch)
echo "Setting default branch to ${BRANCH}..."
gh api "repos/${REPO}" -X PATCH -f default_branch="${BRANCH}" -q '.default_branch' > /dev/null
sleep 3

# Trigger workflow
echo "Triggering hot-cluster-e2e.yml..."
RUN_URL=$(gh workflow run hot-cluster-e2e.yml \
  --repo "${REPO}" \
  --ref "${BRANCH}" \
  -f test_spec="${TEST_SPEC}" 2>&1)
echo "${RUN_URL}"

# Restore original default branch
echo "Restoring default branch to ${ORIGINAL_DEFAULT}..."
gh api "repos/${REPO}" -X PATCH -f default_branch="${ORIGINAL_DEFAULT}" -q '.default_branch' > /dev/null

echo ""
echo "Done. Monitor at: https://github.com/${REPO}/actions"
