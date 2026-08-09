#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

for f in locales/en/* ; do
  for i in "${LANGUAGES[@]}"
  do
  npm run i18n-to-po -- -f "$(basename "$f" .json)" -l "$i"
  done
done

# Clear msgstr that still equal msgid (English placeholders from secondary locales).
# Phrase treats empty msgstr as needing translation. Redundant after migrating to
# ocp-plugin-i18n-scripts (that package filters English during PO generation).
node ./i18n-scripts/clear-english-msgstr.js

