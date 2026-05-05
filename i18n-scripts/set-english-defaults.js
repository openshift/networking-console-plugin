const fs = require('fs');
const path = require('path');
const pluralize = require('pluralize');
const common = require('./common.js');

const publicDir = path.join(__dirname, './../locales/');

// Words that don't change in plural form
const INVARIANT_PLURALS = new Set(['more']);

function determineRule(key) {
  // New CLDR format with {{count}}
  if (key.includes('{{count}}') && key.includes('_one')) {
    return 4; // New rule for _one with count
  }
  if (key.includes('{{count}}') && key.includes('_other')) {
    return 5; // New rule for _other with count
  }

  // Legacy format with {{count}}
  if (key.includes('WithCount_plural')) {
    return 0;
  }
  if (key.includes('WithCount')) {
    return 1;
  }

  // New CLDR format without {{count}}
  if (key.includes('_one')) {
    return 6; // New rule for _one without count
  }
  if (key.includes('_other')) {
    return 7; // New rule for _other without count
  }

  // Legacy format without {{count}}
  if (key.includes('_plural')) {
    return 2;
  }

  // No plural marker
  return 3;
}

function updateFile(fileName, isEnglish) {
  const file = require(fileName);
  const updatedFile = {};

  const keys = Object.keys(file);

  let originalKey;

  for (let i = 0; i < keys.length; i++) {
    // Process if empty string OR if value equals key (default from useKeysAsDefaultValue)
    const needsProcessing = file[keys[i]] === '' || file[keys[i]] === keys[i];

    if (needsProcessing) {
      // For non-English locales, try to migrate from old _plural format first
      if (!isEnglish) {
        let migratedValue = null;

        // Check if this is a new CLDR plural key (_one, _other, _many)
        if (keys[i].includes('_one') || keys[i].includes('_other') || keys[i].includes('_many')) {
          // Extract the base key (without the plural suffix)
          const baseKey = keys[i].replace(/_one$|_other$|_many$/, '');

          // Look for old _plural format key
          const oldPluralKey = baseKey + '_plural';
          if (file[oldPluralKey] && file[oldPluralKey] !== '' && file[oldPluralKey] !== oldPluralKey) {
            // Copy the translation from the old plural format
            migratedValue = file[oldPluralKey];
          }
          // Also check if there's a base key without any suffix
          else if (file[baseKey] && file[baseKey] !== '' && file[baseKey] !== baseKey) {
            migratedValue = file[baseKey];
          }
        }

        if (migratedValue) {
          updatedFile[keys[i]] = migratedValue;
          continue;
        }
      }

      // For English locale or if no migration found, use the standard processing
      if (isEnglish) {
      // follow i18next rules
      // "key": "item",
      // "key_plural": "items",
      // "keyWithCount": "{{count}} item",
      // "keyWithCount_plural": "{{count}} items"
      switch (determineRule(keys[i])) {
        case 0: // Legacy: keyWithCount_plural
          [originalKey] = keys[i].split('WithCount_plural');
          updatedFile[keys[i]] = `{{count}} ${pluralize(originalKey)}`;
          break;
        case 1: // Legacy: keyWithCount
          [originalKey] = keys[i].split('WithCount');
          updatedFile[keys[i]] = `{{count}} ${originalKey}`;
          break;
        case 2: // Legacy: key_plural
          [originalKey] = keys[i].split('_plural');
          updatedFile[keys[i]] = pluralize(originalKey);
          break;
        case 4: // New: {{count}} key_one
          // Extract base key before {{count}}
          const fullKey_one = keys[i].split('_one')[0];
          // Check if it starts with special character
          const hasLeadingPlus_one = fullKey_one.startsWith('+{{count}} ');
          originalKey = fullKey_one.replace(/^[+]?{{count}} /, '');

          if (hasLeadingPlus_one) {
            updatedFile[keys[i]] = `+{{count}} ${pluralize.singular(originalKey)}`;
          } else if (originalKey.includes(' ')) {
            // Multi-word phrases: only pluralize the first word
            const words = originalKey.split(' ');
            words[0] = pluralize.singular(words[0]);
            updatedFile[keys[i]] = `{{count}} ${words.join(' ')}`;
          } else {
            updatedFile[keys[i]] = `{{count}} ${pluralize.singular(originalKey)}`;
          }
          break;
        case 5: // New: {{count}} key_other
          // Extract base key before {{count}}
          const fullKey_other = keys[i].split('_other')[0];
          // Check if it starts with special character
          const hasLeadingPlus_other = fullKey_other.startsWith('+{{count}} ');
          originalKey = fullKey_other.replace(/^[+]?{{count}} /, '');

          if (hasLeadingPlus_other) {
            // Check for invariant plurals
            const pluralForm = INVARIANT_PLURALS.has(originalKey) ? originalKey : pluralize(originalKey);
            updatedFile[keys[i]] = `+{{count}} ${pluralForm}`;
          } else if (originalKey.includes(' ')) {
            // Multi-word phrases: only pluralize the first word
            const words = originalKey.split(' ');
            words[0] = INVARIANT_PLURALS.has(words[0]) ? words[0] : pluralize(words[0]);
            updatedFile[keys[i]] = `{{count}} ${words.join(' ')}`;
          } else {
            const pluralForm = INVARIANT_PLURALS.has(originalKey) ? originalKey : pluralize(originalKey);
            updatedFile[keys[i]] = `{{count}} ${pluralForm}`;
          }
          break;
        case 6: // New: key_one
          originalKey = keys[i].split('_one')[0];
          updatedFile[keys[i]] = pluralize.singular(originalKey);
          break;
        case 7: // New: key_other
          originalKey = keys[i].split('_other')[0];
          updatedFile[keys[i]] = pluralize(originalKey);
          break;
        default: // No plural marker
          updatedFile[keys[i]] = keys[i];
      }
      } else {
        // Non-English locale: just use the key as the value
        updatedFile[keys[i]] = keys[i];
      }
    } else {
      updatedFile[keys[i]] = file[keys[i]];
    }
  }

  fs.promises
    .writeFile(fileName, JSON.stringify(updatedFile, null, 2))
    .catch((e) => console.error(fileName, e));
}

function processLocalesFolder(filePath) {
  const locale = path.basename(filePath);
  const isEnglish = locale === 'en';

  // Process all locale folders, but pass whether it's English or not
  common.parseFolder(filePath, (fileName) => updateFile(fileName, isEnglish));
}

common.parseFolder(publicDir, processLocalesFolder);
