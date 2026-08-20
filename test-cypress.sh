#!/usr/bin/env bash

set -x -o pipefail

source ./cleanup.sh
source ./setup.sh

while getopts g:s: flag
do
  case "${flag}" in
    g) gui=${OPTARG};;
    s) spec=${OPTARG};;
  esac
done

if [ -z "${spec-}" ]; then
  spec="tests/all.cy.ts"
fi

cleanup
setup

mkdir -p ui-tests-cy/gui-test-screenshots

if [ -n "${gui-}" ]; then
  node_modules/.bin/cypress open --project ui-tests-cy --env openshift=true --spec "$spec"
else
  node --max-old-space-size=4096 node_modules/.bin/cypress run --project ui-tests-cy --env openshift=true --browser "${BRIDGE_E2E_BROWSER_NAME:=electron}" --spec "$spec" | tee ui-tests-cy/gui-test-screenshots/build.log
  test_exit_code=${PIPESTATUS[0]}
  npm run cypress-postreport

  if [ ${test_exit_code} -eq 0 ]; then
    cleanup
  fi

  exit ${test_exit_code}
fi
