#!/usr/bin/env node
/**
 * Post-process PO files after export-pos:
 * Clear msgstr when it equals msgid (English placeholder leaked from secondary locales).
 *
 * Phrase/Memsource treats empty msgstr as "needs translation". Leaving English in
 * msgstr can make those strings look already translated.
 *
 * Real non-English translations (msgstr !== msgid) are left untouched.
 *
 * Note: ocp-plugin-i18n-scripts already filters English placeholders during PO
 * generation, so this step is redundant after migrating to that package.
 */

const fs = require('fs');
const path = require('path');

const PO_ROOT = path.join(process.cwd(), 'po-files');

function clearEnglishPlaceholders(content) {
  let cleared = 0;
  // Match single-line msgid/msgstr pairs produced by i18next-conv (foldLength: 0).
  // Skip the header entry (empty msgid).
  const updated = content.replace(
    /msgid "((?:\\.|[^"\\])*)"\nmsgstr "((?:\\.|[^"\\])*)"/g,
    (match, msgid, msgstr) => {
      if (!msgid) {
        return match;
      }
      if (msgstr && msgstr === msgid) {
        cleared += 1;
        return `msgid "${msgid}"\nmsgstr ""`;
      }
      return match;
    },
  );
  return { cleared, updated };
}

function processPoFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { cleared, updated } = clearEnglishPlaceholders(original);
  if (cleared > 0) {
    fs.writeFileSync(filePath, updated);
  }
  console.log(
    `${path.relative(process.cwd(), filePath)}: cleared ${cleared} English placeholder(s)`,
  );
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Missing ${dir}; run export-pos first`);
    process.exit(1);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.po')) {
      processPoFile(full);
    }
  }
}

walk(PO_ROOT);
