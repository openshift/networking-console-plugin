import { getI18n, useTranslation } from 'react-i18next';
import { TOptions } from 'i18next';

/**
 * A Hook for using the i18n translation.
 */
export const useNetworkingTranslation = () => useTranslation('plugin__networking-console-plugin');

/**
 * a function to perform translation to 'plugin__networking-console-plugin' namespace
 * @param value string to translate
 * @param options (optional) options for traslations
 */
// skipcq: JS-C1002
export const t = (value: string, options?: TOptions) =>
  getI18n().t(value, { ns: 'plugin__networking-console-plugin', ...options });
