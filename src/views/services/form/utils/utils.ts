import { ServiceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  IoK8sApiCoreV1Service,
  IoK8sApiCoreV1ServicePort,
} from '@kubevirt-ui-ext/kubevirt-api/kubernetes';

import {
  EXTERNAL_NAME_HOSTNAME_MAX_LENGTH,
  EXTERNAL_NAME_HOSTNAME_REGEX,
  SERVICE_PORT_PROTOCOLS,
  SERVICE_TYPES,
  SERVICE_TYPES_WITH_NODE_PORT,
  ServiceType,
} from './constants';
import type { ServicePortFormData } from './types';

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

const parseTargetPort = (targetPort: string): IoK8sApiCoreV1ServicePort['targetPort'] =>
  (NUMERIC_TARGET_PORT_REGEX.test(targetPort)
    ? Number(targetPort)
    : targetPort) as IoK8sApiCoreV1ServicePort['targetPort'];

export const isValidDNSLabel = (value: string): boolean =>
  value.length <= MAX_DNS_LABEL_LENGTH && DNS_LABEL_REGEX.test(value);

export const isValidExternalNameHostname = (hostname: string): boolean =>
  hostname.length <= EXTERNAL_NAME_HOSTNAME_MAX_LENGTH &&
  EXTERNAL_NAME_HOSTNAME_REGEX.test(hostname);

export const servicePortsToFormData = (
  ports: IoK8sApiCoreV1ServicePort[] = [],
): ServicePortFormData[] =>
  ports.map((port) => ({
    name: port.name || '',
    nodePort: port.nodePort?.toString(),
    port: port.port?.toString() || '',
    protocol: port.protocol || SERVICE_PORT_PROTOCOLS[0],
    targetPort: (port.targetPort ?? port.port)?.toString() || '',
  }));

export const formDataToServicePorts = (ports: ServicePortFormData[]): IoK8sApiCoreV1ServicePort[] =>
  ports.map((port) => ({
    ...(port.name.trim() ? { name: port.name.trim() } : {}),
    ...(port.nodePort ? { nodePort: Number(port.nodePort) } : {}),
    port: Number(port.port),
    protocol: port.protocol,
    targetPort: parseTargetPort(port.targetPort),
  }));

const isSupportedServiceType = (type?: string): type is ServiceType =>
  (SERVICE_TYPES as readonly string[]).includes(type);

export const isNodePortServiceType = (type?: string): boolean =>
  (SERVICE_TYPES_WITH_NODE_PORT as readonly string[]).includes(type);

/**
 * Builds a create/update payload for the supported Service types.
 * ExternalName uses externalName and omits selector/ports.
 * ClusterIP/NodePort/LoadBalancer use selector/ports and omit externalName.
 */
export const buildServiceSubmitPayload = (data: IoK8sApiCoreV1Service): IoK8sApiCoreV1Service => {
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
      ports: (data.spec?.ports || []).map(({ nodePort, ...port }) => {
        if (isNodePortServiceType(type) && nodePort !== undefined) {
          return { ...port, nodePort };
        }

        return port;
      }),
      selector: data.spec?.selector || {},
      type,
    },
  };
};
