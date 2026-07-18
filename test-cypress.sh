#!/usr/bin/env bash

set -x
set +e

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

# Run cleanup and setup before tests
cleanup
setup

mkdir -p cypress/gui-test-screenshots

if [ -n "${gui-}" ]; then
  cd cypress && ../node_modules/.bin/cypress open --env openshift=true --spec "$spec"
else
  cd cypress && node --max-old-space-size=4096 ../node_modules/.bin/cypress run --env openshift=true --browser ${BRIDGE_E2E_BROWSER_NAME:=electron} --spec "$spec" | tee ./gui-test-screenshots/build.log
  test_exit_code=${PIPESTATUS[0]}
  cd ..
  npm run cypress-postreport

  if [ ${test_exit_code} -eq 0 ]; then
    cleanup
  fi
fi
