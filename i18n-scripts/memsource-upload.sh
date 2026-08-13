#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

while getopts v:s: flag
do
  case "${flag}" in
      v) VERSION=${OPTARG};;
      s) SPRINT=${OPTARG};;
      *) echo "usage: $0 [-v] [-s]" >&2
      exit 1;;
  esac
done

BRANCH=$(git branch  --show-current)


echo "Creating project with title \"[OCP $VERSION] UI Localization networking-console-plugin - Sprint $SPRINT/Branch $BRANCH\""

PROJECT_INFO=$(memsource project create --name "[OCP $VERSION] UI Localization networking-console-plugin - Sprint $SPRINT/Branch $BRANCH" --template-id zBOwr4BxYwEq7xlJ37c1F3 -f json)
PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.uid')

# Own the zh-cn → zh symlink so re-running export-pos here works even when
# preparation happened in a different shell (trap is session-local).
cleanup_upload() {
  rm -f locales/zh-cn
  rm -rf po-files locales/tmp
}
trap cleanup_upload EXIT

if [ -e locales/zh-cn ] && [ ! -L locales/zh-cn ]; then
  echo "ERROR: locales/zh-cn exists and is not a symlink; resolve manually" >&2
  exit 1
fi
ln -sfn zh locales/zh-cn

echo "Exporting PO files"
npm run export-pos
echo "Exported all PO files"

echo "Creating jobs for exported PO files"
for i in "${LANGUAGES[@]}"
do
  memsource job create --filenames po-files/"$i"/*.po --target-langs "$i" --project-id "${PROJECT_ID}"
done

echo "Uploaded PO files to Memsource"
# cleanup_upload runs via EXIT trap
