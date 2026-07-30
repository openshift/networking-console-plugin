import { TFunction } from 'i18next';

import { isTagValid } from '@utils/components/PodSelectorModal/selectorUtils';

import { EXTERNAL_NAME_HOSTNAME_REGEX } from './constants';
import type { ServiceFormFieldErrors, ValidationResult } from './types';
import { isValidDNSLabel, parsePortText } from './utils';

const validResult = (): ValidationResult => ({ errorMessage: '', isValid: true });

const invalidResult = (errorMessage: string): ValidationResult => ({
  errorMessage,
  isValid: false,
});

const SERVICE_PROTOCOLS = new Set(['TCP', 'UDP', 'SCTP']);

export const validatePort = (t: TFunction, value: unknown): ValidationResult => {
  if (value === '' || value === null || value === undefined) {
    return invalidResult(t('Port is required'));
  }

  const port = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return invalidResult(t('Port must be between 1 and 65535'));
  }

  return validResult();
};

export const validateSelectorText = (t: TFunction, text: string): ValidationResult => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return invalidResult(t('Selector is required'));
  }

  for (const line of lines) {
    if (!isTagValid(line, true)) {
      return invalidResult(t('Selectors must use valid key=value pairs'));
    }
  }

  return validResult();
};

export const validateSelectorPairs = (t: TFunction, pairs: string[][]): ValidationResult => {
  // Ignore only fully empty rows; keep partially filled rows for validation.
  const active = pairs.filter(([key, value]) => Boolean(key?.trim()) || Boolean(value?.trim()));

  if (!active.length) {
    return invalidResult(t('Selector is required'));
  }

  for (const [key, value] of active) {
    if (!isTagValid(`${key}=${value ?? ''}`, true)) {
      return invalidResult(t('Selectors must use valid key=value pairs'));
    }
  }

  const keys = active.map(([key]) => key.trim());
  if (new Set(keys).size !== keys.length) {
    return invalidResult(t('Selector keys must be unique'));
  }

  return validResult();
};

export const validatePortsText = (t: TFunction, text: string): ValidationResult => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return invalidResult(t('At least one port is required'));
  }

  const seenNames = new Set<string>();

  for (const line of lines) {
    const parsed = parsePortText(line);

    if (!parsed) {
      return invalidResult(t('Ports must use the format [name:]port:targetPort/PROTOCOL'));
    }

    if (parsed.name) {
      if (!isValidDNSLabel(parsed.name)) {
        return invalidResult(t('Port names must be valid DNS labels'));
      }
      if (seenNames.has(parsed.name)) {
        return invalidResult(t('Port names must be unique'));
      }
      seenNames.add(parsed.name);
    }

    const portResult = validatePort(t, Number(parsed.port));
    if (!portResult.isValid) {
      return portResult;
    }

    if (/^\d+$/.test(parsed.targetPort)) {
      const targetResult = validatePort(t, Number(parsed.targetPort));
      if (!targetResult.isValid) {
        return targetResult;
      }
    } else if (!isValidDNSLabel(parsed.targetPort)) {
      return invalidResult(t('Target port names must be valid DNS labels'));
    }

    if (!SERVICE_PROTOCOLS.has(parsed.protocol)) {
      return invalidResult(t('Protocol must be TCP, UDP, or SCTP'));
    }
  }

  return validResult();
};

export const validateExternalName = (t: TFunction, value?: string): ValidationResult => {
  const externalName = value?.trim() ?? '';

  if (!externalName) {
    return invalidResult(t('External name is required'));
  }

  if (!EXTERNAL_NAME_HOSTNAME_REGEX.test(externalName)) {
    return invalidResult(t('External name must be a valid hostname'));
  }

  return validResult();
};

/** Validates selector pairs and ports text fields used by ClusterIP/NodePort/LoadBalancer. */
export const getServiceFormFieldErrors = (
  t: TFunction,
  selectorPairs: string[][],
  portsText: string,
  serviceType?: string,
): ServiceFormFieldErrors => {
  if (serviceType === 'ExternalName') {
    return {};
  }

  const selectorValidation = validateSelectorPairs(t, selectorPairs);
  const portsValidation = validatePortsText(t, portsText);

  return {
    portsError: portsValidation.isValid ? undefined : portsValidation.errorMessage,
    selectorError: selectorValidation.isValid ? undefined : selectorValidation.errorMessage,
  };
};
