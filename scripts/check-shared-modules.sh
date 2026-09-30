#!/usr/bin/env bash
set -euo pipefail

# Verify there is only one resolution per each shared module in package-lock.json.
# Shared modules are packages provided by the OpenShift Console at runtime.
# A violation means a dependency pulled in a second version of a shared package,
# which would cause runtime conflicts.
#
# Checks:
#   1. @patternfly packages — one resolution per package, declared in package.json
#   2. Shared modules (and similar) listed in dependabot.yml — one resolution per package
#   3. All packages present in the lockfile are declared in package.json

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

# Verify PatternFly packages present in the lockfile are declared in package.json
lockfile_pf_packages=$(echo "$unique_resolved" | grep -oP '@patternfly/[\w-]+' | sort -u)
for pkg in $lockfile_pf_packages; do
  if ! grep -q "\"${pkg}\"" package.json; then
    echo "❌ $pkg — resolved in lockfile but missing from package.json"
    errors=$((errors + 1))
  fi
done

# --- 2. Shared modules (Console >=4.19) ---

echo ""
echo "=== Shared modules ==="
echo ""

# all shared (and similar) modules ever used in the Console (>=4.19)
# exclude react-router because it's imported directly from react-router-dom-v5-compat
shared_modules="
  @openshift/dynamic-plugin-sdk
  @openshift-console/dynamic-plugin-sdk
  @openshift-console/dynamic-plugin-sdk-internal
  react
  react-i18next
  react-redux
  react-router-dom
  react-router-dom-v5-compat
  redux
  redux-thunk
  @openshift-console/dynamic-plugin-sdk-webpack
  @openshift/dynamic-plugin-sdk-webpack
"

for pkg in $shared_modules; do
  # Match the exact package via its resolved URL pattern:
  #   registry.npmjs.org/PACKAGE/-/SHORTNAME-VERSION.tgz
  url_pattern="registry.npmjs.org/${pkg}/-/"
  resolved_urls=$(grep -oP "${url_pattern}[^\"]+" package-lock.json | sort -u || true)

  if [ -z "$resolved_urls" ]; then
    # skip silently - not in lockfile
    continue
  fi

  # Verify shared modules present in the lockfile are declared in package.json
  if ! grep -q "\"${pkg}\"" package.json; then
    echo "❌ $pkg — resolved in lockfile but missing from package.json"
    errors=$((errors + 1))
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
