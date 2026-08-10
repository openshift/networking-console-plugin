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

function assertUnderPoRoot(candidatePath) {
  const root = fs.realpathSync(PO_ROOT);
  const resolved = fs.realpathSync(candidatePath);
  const relative = path.relative(root, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`PO path escapes ${PO_ROOT}: ${candidatePath}`);
  }
  return resolved;
}

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
  const safeDir = assertUnderPoRoot(dir);
  for (const entry of fs.readdirSync(safeDir, { withFileTypes: true })) {
    // Skip symlinks so a crafted .po symlink cannot escape PO_ROOT.
    if (entry.isSymbolicLink()) {
      console.warn(`Skipping symlink under po-files: ${path.join(safeDir, entry.name)}`);
      continue;
    }
    const full = path.resolve(safeDir, entry.name);
    if (entry.isDirectory()) {
      walk(assertUnderPoRoot(full));
    } else if (entry.name.endsWith('.po')) {
      processPoFile(assertUnderPoRoot(full));
    }
  }
}

walk(PO_ROOT);
