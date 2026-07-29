import { isTagValid } from '@utils/components/PodSelectorModal/selectorUtils';
import { t } from '@utils/hooks/useNetworkingTranslation';

import { isValidDnsLabel, parsePortText } from './utils';

export type ValidationResult = {
  errorMessage: string;
  isValid: boolean;
};

const validResult = (): ValidationResult => ({ errorMessage: '', isValid: true });

const invalidResult = (errorMessage: string): ValidationResult => ({
  errorMessage,
  isValid: false,
});

const SERVICE_PROTOCOLS = new Set(['TCP', 'UDP', 'SCTP']);

export const validatePort = (value: unknown): ValidationResult => {
  if (value === '' || value === null || value === undefined) {
    return invalidResult(t('Port is required'));
  }

  const port = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return invalidResult(t('Port must be between 1 and 65535'));
  }

  return validResult();
};

export const validateSelectorText = (text: string): ValidationResult => {
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

export const validatePortsText = (text: string): ValidationResult => {
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
      if (!isValidDnsLabel(parsed.name)) {
        return invalidResult(t('Port names must be valid DNS labels'));
      }
      if (seenNames.has(parsed.name)) {
        return invalidResult(t('Port names must be unique'));
      }
      seenNames.add(parsed.name);
    }

    const portResult = validatePort(Number(parsed.port));
    if (!portResult.isValid) {
      return portResult;
    }

    if (/^\d+$/.test(parsed.targetPort)) {
      const targetResult = validatePort(Number(parsed.targetPort));
      if (!targetResult.isValid) {
        return targetResult;
      }
    }

    if (!SERVICE_PROTOCOLS.has(parsed.protocol)) {
      return invalidResult(t('Protocol must be TCP, UDP, or SCTP'));
    }
  }

  return validResult();
};

/** RFC-1123 subdomain / hostname used by ExternalName services. */
const EXTERNAL_NAME_HOSTNAME_REGEX =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)+$/i;

export const validateExternalName = (value?: string): ValidationResult => {
  const externalName = value?.trim() ?? '';

  if (!externalName) {
    return invalidResult(t('External name is required'));
  }

  if (!EXTERNAL_NAME_HOSTNAME_REGEX.test(externalName)) {
    return invalidResult(t('External name must be a valid hostname'));
  }

  return validResult();
};

export type ServiceFormFieldErrors = {
  portsError?: string;
  selectorError?: string;
};

/** Validates selector and ports text fields used by ClusterIP/NodePort/LoadBalancer. */
export const getServiceFormFieldErrors = (
  selectorText: string,
  portsText: string,
  serviceType?: string,
): ServiceFormFieldErrors => {
  if (serviceType === 'ExternalName') {
    return {};
  }

  const selectorValidation = validateSelectorText(selectorText);
  const portsValidation = validatePortsText(portsText);

  return {
    portsError: portsValidation.isValid ? undefined : portsValidation.errorMessage,
    selectorError: selectorValidation.isValid ? undefined : selectorValidation.errorMessage,
  };
};
