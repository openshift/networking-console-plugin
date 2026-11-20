/**
 * Initializes the default i18next instance with the English catalog, so `useTranslation` and
 * `Trans` resolve real strings — interpolation and plural forms included — the way the console
 * does at runtime. Each Jest project loads one entry file that supplies the catalog for its
 * module system.
 */
import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

const NAMESPACE = 'plugin__networking-console-plugin';

export const initI18n = (translations: Record<string, string>): void => {
  if (i18next.isInitialized) {
    return;
  }
  i18next.use(initReactI18next).init({
    defaultNS: NAMESPACE,
    fallbackLng: 'en',
    // Synchronous initialization: the first render must already be `ready`, there is no boundary.
    initAsync: false,
    interpolation: { escapeValue: false },
    // The catalog is flat and its keys contain dots, as `i18next-parser.config.js` extracts them.
    keySeparator: false,
    lng: 'en',
    ns: [NAMESPACE],
    nsSeparator: '~',
    react: { useSuspense: false },
    resources: { en: { [NAMESPACE]: translations } },
  });
};
