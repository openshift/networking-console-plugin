import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  IoK8sApiCoreV1Service,
  IoK8sApiCoreV1ServicePort,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';

import { SERVICE_TYPES, ServiceType } from './constants';
import type { ParsedPortText } from './types';

export const generateDefaultService = (namespace: string): IoK8sApiCoreV1Service => ({
  apiVersion: ServiceModel.apiVersion,
  kind: ServiceModel.kind,
  metadata: {
    name: 'example',
    namespace,
  },
  spec: {
    ports: [
      {
        port: 80,
        protocol: 'TCP',
        targetPort: 9376 as unknown as string,
      },
    ],
    selector: {
      app: 'MyApp',
    },
    type: 'ClusterIP',
  },
});

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

const DNS_LABEL_REGEX = /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?$/;
const MAX_DNS_LABEL_LENGTH = 63;
const NUMERIC_TARGET_PORT_REGEX = /^\d+$/;

/**
 * Matches `name:port:targetPort[/PROTOCOL]` (e.g. `http:80:9376/TCP`).
 * Groups: 1=name, 2=port, 3=targetPort, 4=optional protocol.
 */
const PORT_LINE_WITH_NAME_REGEX =
  /^([a-z0-9](?:[-a-z0-9]*[a-z0-9])?)\s*:\s*(\d+)\s*:\s*([^/\s]+)\s*(?:\/\s*(\w+))?$/i;

/**
 * Matches `port:targetPort[/PROTOCOL]` (e.g. `80:9376/TCP`).
 * Groups: 1=port, 2=targetPort, 3=optional protocol.
 */
const PORT_LINE_REGEX = /^(\d+)\s*:\s*([^/\s]+)\s*(?:\/\s*(\w+))?$/;

const parseTargetPort = (targetPort: string): IoK8sApiCoreV1ServicePort['targetPort'] =>
  (NUMERIC_TARGET_PORT_REGEX.test(targetPort)
    ? Number(targetPort)
    : targetPort) as IoK8sApiCoreV1ServicePort['targetPort'];

export const isValidDNSLabel = (value: string): boolean =>
  value.length <= MAX_DNS_LABEL_LENGTH && DNS_LABEL_REGEX.test(value);

/** Parses a single ports-field line into port, targetPort, and protocol parts. */
export const parsePortText = (text: string): null | ParsedPortText => {
  const namedMatch = text.match(PORT_LINE_WITH_NAME_REGEX);
  if (namedMatch) {
    const [, name, port, targetPort, protocol = 'TCP'] = namedMatch;
    return {
      name: name.toLowerCase(),
      port,
      protocol: protocol.toUpperCase(),
      targetPort,
    };
  }

  const match = text.match(PORT_LINE_REGEX);
  if (!match) return null;

  const [, port, targetPort, protocol = 'TCP'] = match;
  return {
    port,
    protocol: protocol.toUpperCase(),
    targetPort,
  };
};

/** Ensures every port has a unique DNS_LABEL name when more than one port is defined. */
export const ensurePortNames = (
  ports: IoK8sApiCoreV1ServicePort[],
): IoK8sApiCoreV1ServicePort[] => {
  if (ports.length <= 1) {
    return ports;
  }

  const usedNames = new Set(
    ports.map((port) => port.name).filter((name): name is string => Boolean(name)),
  );

  return ports.map((port) => {
    if (port.name && isValidDNSLabel(port.name)) {
      return port;
    }

    let candidate = `port-${port.port}`;
    let suffix = 1;
    while (usedNames.has(candidate)) {
      candidate = `port-${port.port}-${suffix++}`;
    }
    usedNames.add(candidate);

    return {
      ...port,
      name: candidate,
    };
  });
};

export const portsToText = (ports: IoK8sApiCoreV1ServicePort[] = []): string =>
  ensurePortNames(ports)
    .map((port) => {
      const target = port.targetPort ?? port.port;
      const protocol = port.protocol || 'TCP';
      const portTargetProtocol = `${port.port}:${target}/${protocol}`;

      return port.name ? `${port.name}:${portTargetProtocol}` : portTargetProtocol;
    })
    .join('\n');

export const textToPorts = (text: string): IoK8sApiCoreV1ServicePort[] => {
  const ports = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const parsed = parsePortText(line);
      if (!parsed) {
        return [];
      }

      return [
        {
          ...(parsed.name ? { name: parsed.name } : {}),
          port: Number(parsed.port),
          protocol: parsed.protocol,
          targetPort: parseTargetPort(parsed.targetPort),
        },
      ];
    });

  return ensurePortNames(ports);
};

const isSupportedServiceType = (type?: string): type is ServiceType =>
  (SERVICE_TYPES as readonly string[]).includes(type);

/**
 * Builds a create/update payload for the form-supported Service types.
 * ExternalName uses externalName and omits selector/ports.
 * ClusterIP/NodePort/LoadBalancer use selector/ports and omit externalName.
 */
export const buildServiceSubmitPayload = (
  data: IoK8sApiCoreV1Service,
  portsText: string,
): IoK8sApiCoreV1Service => {
  const type = isSupportedServiceType(data.spec?.type) ? data.spec.type : 'ClusterIP';

  if (type === 'ExternalName') {
    const { ports: _omittedPorts, selector: _omittedSelector, ...specRest } = data.spec || {};

    return {
      ...data,
      spec: {
        ...specRest,
        externalName: data.spec?.externalName?.trim(),
        type,
      },
    };
  }

  const { externalName: _omittedExternalName, ...specRest } = data.spec || {};

  return {
    ...data,
    spec: {
      ...specRest,
      ports: textToPorts(portsText),
      selector: data.spec?.selector || {},
      type,
    },
  };
};
