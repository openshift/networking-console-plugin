#!/usr/bin/env bash
set -euo pipefail

# Verify there is only one resolution per each shared module in package-lock.json.
# Shared modules are packages provided by the OpenShift Console at runtime.
# A violation means a dependency pulled in a second version of a shared package,
# which would cause runtime conflicts.
#
# Checks:
#   1. @patternfly packages — one resolution per package
#   2. Shared modules from .github/dependabot.yml ignore list — one resolution per package

errors=0

# --- 1. PatternFly packages ---

echo "=== @patternfly packages ==="
echo ""

unique_resolved=$(grep "@patternfly" package-lock.json | grep resolved | sort -u)

unique_count=$(echo "$unique_resolved" | wc -l)
pkg_count=$(echo "$unique_resolved" | grep -oP '@patternfly/[\w-]+' | sort -u | wc -l)

echo "Unique @patternfly resolved URLs: $unique_count"
echo "Unique @patternfly package names: $pkg_count"

if [ "$unique_count" -ne "$pkg_count" ]; then
  echo ""
  echo "❌ Multiple resolutions detected for one or more PatternFly packages!"
  echo "There should be only one resolution per each PatternFly package."
  echo ""
  echo "Packages with multiple resolutions:"
  echo "$unique_resolved" | grep -oP '@patternfly/[\w-]+' | sort | uniq -d
  errors=$((errors + 1))
else
  echo "✅ All PatternFly packages have a single resolution."
fi

# --- 2. Shared modules from dependabot ignore list ---

echo ""
echo "=== Shared modules ==="
echo ""

# Extract shared module names from the dependabot ignore list,
# excluding @patternfly (checked above) and glob patterns.
# TODO: unignore @openshift/dynamic-plugin-sdk once it is updated to 4.23.0-prerelease.5
shared_modules=$(grep "dependency-name:" .github/dependabot.yml \
  | sed "s/.*dependency-name: *'\\?//" \
  | sed "s/'$//" \
  | grep -v '@patternfly/' \
  | grep -v '\*' \
  | grep -v '@openshift/dynamic-plugin-sdk' \
  | sort -u)

for pkg in $shared_modules; do
  # Match the exact package via its resolved URL pattern:
  #   registry.npmjs.org/PACKAGE/-/SHORTNAME-VERSION.tgz
  url_pattern="registry.npmjs.org/${pkg}/-/"
  resolved_urls=$(grep -oP "${url_pattern}[^\"]+" package-lock.json | sort -u || true)

  if [ -z "$resolved_urls" ]; then
    # skip silently - not in lockfile
    continue
  fi

  url_count=$(echo "$resolved_urls" | wc -l)

  if [ "$url_count" -eq 1 ]; then
    # Extract version from tgz filename by stripping the package short name prefix
    short_name="${pkg##*/}"
    tgz="${resolved_urls##*/}"
    version="${tgz#"${short_name}-"}"
    version="${version%.tgz}"
    echo "✅ $pkg ($version)"
  else
    echo "❌ $pkg — $url_count resolutions found:"
    echo "$resolved_urls" | sed 's/^/     /'
    errors=$((errors + 1))
  fi
done

# --- Summary ---

echo ""
if [ "$errors" -gt 0 ]; then
  echo "❌ $errors check(s) failed. Each shared module must have a single resolution."
  exit 1
fi

echo "✅ All shared modules have a single resolution."
