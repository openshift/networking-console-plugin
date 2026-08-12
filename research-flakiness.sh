#!/usr/bin/env bash

set -x
set +e

PROBLEM_DIR="problem"
TOTAL_RUNS=10
PASS_COUNT=0
FAIL_COUNT=0

mkdir -p "${PROBLEM_DIR}"

for i in $(seq -w 1 ${TOTAL_RUNS}); do
  echo "========================================"
  echo "  RUN ${i} of ${TOTAL_RUNS}"
  echo "========================================"

  # Clean previous test artifacts
  rm -rf cypress/gui-test-screenshots/*

  # Run the test suite
  ./test-cypress.sh
  exit_code=$?

  if [ ${exit_code} -ne 0 ]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RUN_DIR="${PROBLEM_DIR}/run${i}"
    mkdir -p "${RUN_DIR}"

    # Copy screenshots and videos
    if [ -d "cypress/gui-test-screenshots/screenshots" ]; then
      cp -r cypress/gui-test-screenshots/screenshots "${RUN_DIR}/"
    fi
    if [ -d "cypress/gui-test-screenshots/videos" ]; then
      cp -r cypress/gui-test-screenshots/videos "${RUN_DIR}/"
    fi
    if [ -f "cypress/gui-test-screenshots/build.log" ]; then
      cp cypress/gui-test-screenshots/build.log "${RUN_DIR}/"
    fi

    # Extract failure info into analysis.md
    cat > "${RUN_DIR}/analysis.md" <<ANALYSIS
# Run ${i} — FAILED

## Failing tests

$(grep -E "^\s+\d\)" cypress/gui-test-screenshots/build.log 2>/dev/null || echo "Could not extract test names")

## Error messages

$(grep -A5 "^\s+\d\) " cypress/gui-test-screenshots/build.log 2>/dev/null | head -60 || echo "Could not extract errors")

## Observations

- The NAD creation form uses react-hook-form with auto-generated names
- The naive approach (clear + type without waits) races with React re-renders
- The form may overwrite user input after async state updates

ANALYSIS

    echo "  -> FAILED (evidence saved to ${RUN_DIR}/)"
  else
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "  -> PASSED"
  fi
done

echo ""
echo "========================================"
echo "  RESULTS: ${PASS_COUNT} passed, ${FAIL_COUNT} failed out of ${TOTAL_RUNS} runs"
echo "========================================"

# Write summary
cat > "${PROBLEM_DIR}/summary.md" <<SUMMARY
# NAD Form Flakiness Research — Summary

## Results

- **Total runs:** ${TOTAL_RUNS}
- **Passed:** ${PASS_COUNT}
- **Failed:** ${FAIL_COUNT}
- **Failure rate:** $((FAIL_COUNT * 100 / TOTAL_RUNS))%

## Problem Description

The NetworkAttachmentDefinition (NAD) creation form in the networking-console-plugin
uses \`react-hook-form\` which auto-generates a random name on mount. When Cypress
types into the name field immediately after the form renders, React's asynchronous
state updates can overwrite the typed value with the auto-generated name.

### Root Cause

The form component calls \`register('name', { required: true })\` which creates a
controlled input. On initial render (and on network-type selection), the form state
resets and generates a new random name. If Cypress types before this reset completes,
the typed value is lost.

### Affected Tests

- NAD Bridge creation (name overwritten by auto-generated value)
- NAD Localnet creation (same issue)
- NAD OVN/L2 overlay creation (same issue, plus submit button stays disabled)

### Evidence

Each \`runXX/\` folder contains:
- \`screenshots/\` — failure screenshots showing the form state at time of failure
- \`videos/\` — full test recording
- \`build.log\` — Cypress console output
- \`analysis.md\` — per-run failure details

### Recommended Fix (for developers)

1. Remove the auto-generated name from the form initial state, OR
2. Add a \`data-test-ready\` attribute after the form has fully initialized, so tests can wait for it, OR
3. Debounce/stabilize the form state before allowing user input

SUMMARY

echo "Summary written to ${PROBLEM_DIR}/summary.md"
