import { TFunction } from 'i18next';

import { isTagValid } from '@utils/components/PodSelectorModal/selectorUtils';

import { SERVICE_PORT_PROTOCOLS } from './constants';
import type { ServiceFormFieldErrors, ServicePortFormData, ValidationResult } from './types';
import { isValidDNSLabel, isValidExternalNameHostname } from './utils';

const validResult = (): ValidationResult => ({ errorMessage: '', isValid: true });

const invalidResult = (errorMessage: string): ValidationResult => ({
  errorMessage,
  isValid: false,
});

const serviceProtocols = new Set(SERVICE_PORT_PROTOCOLS);

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

export const validateServicePorts = (
  t: TFunction,
  ports: ServicePortFormData[],
  serviceType?: string,
): ValidationResult => {
  if (!ports.length) return invalidResult(t('At least one port is required'));

  const names = new Set<string>();
  for (const servicePort of ports) {
    const portResult = validatePort(t, servicePort.port);
    if (!portResult.isValid) return portResult;

    if (!servicePort.targetPort.trim()) return invalidResult(t('Target port is required'));
    if (/^\d+$/.test(servicePort.targetPort)) {
      const targetPortResult = validatePort(t, servicePort.targetPort);
      if (!targetPortResult.isValid) return targetPortResult;
    } else if (!isValidDNSLabel(servicePort.targetPort)) {
      return invalidResult(t('Target port names must be valid DNS labels'));
    }

    if (!serviceProtocols.has(servicePort.protocol as (typeof SERVICE_PORT_PROTOCOLS)[number])) {
      return invalidResult(t('Protocol must be TCP, UDP, or SCTP'));
    }

    const name = servicePort.name.trim();
    if (ports.length > 1 && !name) {
      return invalidResult(t('Port name is required when multiple ports are configured'));
    }
    if (name) {
      if (!isValidDNSLabel(name)) return invalidResult(t('Port names must be valid DNS labels'));
      if (names.has(name)) return invalidResult(t('Port names must be unique'));
      names.add(name);
    }

    if ((serviceType === 'NodePort' || serviceType === 'LoadBalancer') && servicePort.nodePort) {
      const nodePortResult = validatePort(t, servicePort.nodePort);
      if (!nodePortResult.isValid) return nodePortResult;
    }
  }

  return validResult();
};

export const validateExternalName = (t: TFunction, value?: string): ValidationResult => {
  const externalName = value?.trim() ?? '';

  if (!externalName) {
    return invalidResult(t('External name is required'));
  }

  if (!isValidExternalNameHostname(externalName)) {
    return invalidResult(t('External name must be a valid hostname'));
  }

  return validResult();
};

/** Validates selector pairs and ports used by ClusterIP/NodePort/LoadBalancer. */
export const getServiceFormFieldErrors = (
  t: TFunction,
  selectorPairs: string[][],
  ports: ServicePortFormData[],
  serviceType?: string,
): ServiceFormFieldErrors => {
  if (serviceType === 'ExternalName') {
    return {};
  }

  const selectorValidation = validateSelectorPairs(t, selectorPairs);
  const portsValidation = validateServicePorts(t, ports, serviceType);

  return {
    portsError: portsValidation.isValid ? undefined : portsValidation.errorMessage,
    selectorError: selectorValidation.isValid ? undefined : selectorValidation.errorMessage,
  };
};
