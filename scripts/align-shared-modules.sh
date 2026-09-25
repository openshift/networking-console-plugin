#!/usr/bin/env bash
set -euo pipefail

# Align shared dependency versions in package.json with the resolved versions
# from the OpenShift console yarn.lock on a given branch.
#
# Shared dependencies include:
#   - All @patternfly packages present in package.json
#   - Shared modules from the dependabot ignore list (.github/dependabot.yml)
#
# Usage:
#   ./scripts/align-shared-modules.sh [BRANCH]
#
# BRANCH defaults to the current local git branch name.

BRANCH="${1:-$(git branch --show-current)}"
YARN_LOCK_URL="https://raw.githubusercontent.com/openshift/console/refs/heads/${BRANCH}/frontend/yarn.lock"

echo "Branch: $BRANCH"
echo "Fetching yarn.lock from: $YARN_LOCK_URL"
echo ""

yarn_lock=$(curl -fsSL "$YARN_LOCK_URL") || {
  echo "❌ Failed to fetch yarn.lock for branch '$BRANCH'."
  echo "   URL: $YARN_LOCK_URL"
  exit 1
}

# --- Parse console versions from yarn.lock ---
# Resolution lines look like:  resolution: "PACKAGE@npm:VERSION"

# @patternfly versions
pf_versions=$(echo "$yarn_lock" \
  | grep 'resolution: "@patternfly/' \
  | grep -oP '@patternfly/[\w-]+@npm:[^"]+' \
  | sed 's/@npm:/=/' \
  | sort -u)

# Shared module versions (from dependabot ignore list, excluding @patternfly and globs)
shared_modules=$(grep "dependency-name:" .github/dependabot.yml \
  | sed "s/.*dependency-name: *'\\?//" \
  | sed "s/'$//" \
  | grep -v '@patternfly/' \
  | grep -v '\*' \
  | sort -u)

shared_versions=""
for pkg in $shared_modules; do
  version=$(echo "$yarn_lock" | grep -oP "resolution: \"${pkg}@npm:\K[^\"]+" || true)
  if [ -n "$version" ]; then
    shared_versions+="${pkg}=${version}"$'\n'
  fi
done
shared_versions=$(echo "$shared_versions" | grep -v '^$' | sort -u)

# Merge into a single lookup
all_versions=$(printf '%s\n%s' "$pf_versions" "$shared_versions" | grep -v '^$' | sort -u)

if [ -z "$all_versions" ]; then
  echo "❌ No packages found in the fetched yarn.lock."
  exit 1
fi

echo "Resolved versions from console ($BRANCH):"
echo "$all_versions" | sed 's/=/ → /'
echo ""

# --- Update package.json ---

# Collect packages to align: @patternfly from package.json + shared modules present in package.json
local_packages=$(grep -oP '"@patternfly/[\w-]+"' package.json | tr -d '"' | sort -u)
for pkg in $shared_modules; do
  if grep -q "\"${pkg}\"" package.json; then
    local_packages+=$'\n'"${pkg}"
  fi
done
local_packages=$(echo "$local_packages" | grep -v '^$' | sort -u)

changes=0
for pkg in $local_packages; do
  console_version=$(echo "$all_versions" | { grep "^${pkg}=" || true; } | head -1 | cut -d= -f2)

  if [ -z "$console_version" ]; then
    # skip silently if not found in console yarn.lock
    continue
  fi

  current=$(grep "\"${pkg}\"" package.json | grep -oP '"\K[~^]?[0-9][^"]+')
  target="${console_version}"

  if [ "$current" = "$target" ]; then
    echo "✅ $pkg is already at $target"
  else
    echo "🔄 $pkg: $current → $target"
    escaped_pkg=$(echo "$pkg" | sed 's/[\/&@]/\\&/g')
    sed -i "s/\"${escaped_pkg}\": \"[^\"]*\"/\"${escaped_pkg}\": \"${target}\"/" package.json
    changes=$((changes + 1))
  fi
done

echo ""
if [ "$changes" -gt 0 ]; then
  echo "Updated $changes package(s) in package.json."
  echo "Run 'npm install' to update package-lock.json."
else
  echo "✅ All packages are already aligned with console ($BRANCH)."
fi
