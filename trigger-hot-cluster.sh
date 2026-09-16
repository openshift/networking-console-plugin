#!/usr/bin/env bash
#
# Trigger the hot-cluster E2E workflow on a fork branch.
# Usage: ./trigger-hot-cluster.sh [branch] [test_spec]
#
set -euo pipefail

REPO="${REPO:-openshift/networking-console-plugin}"
BRANCH="${1:-main}"
TEST_SPEC="${2:-tests/all.cy.ts}"

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
