import { IoK8sApiCoreV1ServicePort } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { isTagValid } from '@utils/components/PodSelectorModal/selectorUtils';
import { t } from '@utils/hooks/useNetworkingTranslation';

export const selectorToText = (selector: Record<string, string> = {}): string =>
  Object.entries(selector)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

export const textToSelector = (text: string): Record<string, string> =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split('=');
      if (key) {
        acc[key.trim()] = rest.join('=').trim();
      }
      return acc;
    }, {});

export const portsToText = (ports: IoK8sApiCoreV1ServicePort[] = []): string =>
  ports
    .map((port) => `${port.port}:${port.targetPort ?? port.port}/${port.protocol || 'TCP'}`)
    .join('\n');

export const textToPorts = (text: string): IoK8sApiCoreV1ServicePort[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\d+)\s*:\s*([^/\s]+)\s*(?:\/\s*(\w+))?$/);
      if (!match) {
        return [];
      }

      const [, port, targetPort, protocol = 'TCP'] = match;
      // Numeric targetPorts must be numbers; digit-only strings fail named-port validation
      const parsedTargetPort = /^\d+$/.test(targetPort) ? Number(targetPort) : targetPort;

      return [
        {
          port: Number(port),
          protocol: protocol.toUpperCase(),
          targetPort: parsedTargetPort as IoK8sApiCoreV1ServicePort['targetPort'],
        },
      ];
    });

export const validatePort = (value: unknown): string | true => {
  if (value === '' || value === null || value === undefined) {
    return t('Port is required');
  }

  const port = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return t('Port must be between 1 and 65535');
  }

  return true;
};

export const validateSelectorText = (text: string): string | true => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return t('Selector is required');
  }

  for (const line of lines) {
    if (!isTagValid(line, true)) {
      return t('Selectors must use valid key=value pairs');
    }
  }

  return true;
};

export const validatePortsText = (text: string): string | true => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return t('At least one port is required');
  }

  for (const line of lines) {
    const match = line.match(/^(\d+)\s*:\s*([^/\s]+)\s*(?:\/\s*(\w+))?$/);
    if (!match) {
      return t('Ports must use the format port:targetPort/PROTOCOL');
    }

    const portResult = validatePort(Number(match[1]));
    if (portResult !== true) {
      return portResult;
    }

    if (/^\d+$/.test(match[2])) {
      const targetResult = validatePort(Number(match[2]));
      if (targetResult !== true) {
        return targetResult;
      }
    }
  }

  return true;
};
