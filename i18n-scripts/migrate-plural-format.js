const fs = require('fs');
const path = require('path');
const common = require('./common.js');

const publicDir = path.join(__dirname, './../locales/');

/**
 * Migrates translations from old i18next plural format (_plural suffix)
 * to new CLDR format (_one, _other, _many suffixes).
 * This must run BEFORE i18next-parser to preserve translations.
 */
function migrateFile(fileName) {
  const file = JSON.parse(fs.readFileSync(fileName, 'utf8'));
  const updatedFile = {};
  const keys = Object.keys(file);

  // First pass: copy all existing keys
  for (let i = 0; i < keys.length; i++) {
    updatedFile[keys[i]] = file[keys[i]];
  }

  // Second pass: migrate _plural keys to CLDR format
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (key.endsWith('_plural')) {
      const baseKey = key.replace(/_plural$/, '');
      const translation = file[key];

      // Only migrate if there's an actual translation (not empty or key-as-value)
      if (translation && translation !== '' && translation !== key) {
        // Create _one, _other, and _many variants with the same translation
        // i18next-parser will keep these and only add new ones if missing
        if (!updatedFile[baseKey + '_one'] || updatedFile[baseKey + '_one'] === '') {
          updatedFile[baseKey + '_one'] = translation;
        }
        if (!updatedFile[baseKey + '_other'] || updatedFile[baseKey + '_other'] === '') {
          updatedFile[baseKey + '_other'] = translation;
        }
        // Some locales (like Spanish) use _many
        if (!updatedFile[baseKey + '_many'] || updatedFile[baseKey + '_many'] === '') {
          updatedFile[baseKey + '_many'] = translation;
        }
      }

      // Keep the old _plural key for now - i18next-parser will remove it if not needed
    }
  }

  fs.writeFileSync(fileName, JSON.stringify(updatedFile, null, 2) + '\n');
}

function processLocalesFolder(filePath) {
  const locale = path.basename(filePath);

  // Skip English - set-english-defaults.js will handle it with proper pluralization
  if (locale === 'en') {
    return;
  }

  // Process non-English locale folders
  common.parseFolder(filePath, migrateFile);
}

common.parseFolder(publicDir, processLocalesFolder);
