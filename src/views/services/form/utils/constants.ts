export const SERVICE_TYPES = ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const NAME_FIELD_ID = 'service-name';
export const NAMESPACE_FIELD_ID = 'service-namespace';
export const SERVICE_TYPE_FIELD_ID = 'service-type';
export const EXTERNAL_NAME_FIELD_ID = 'service-external-name';
export const SELECTOR_FIELD_ID = 'service-selector';
export const PORTS_FIELD_ID = 'service-ports';

/** Max length for a DNS-1123 subdomain (Kubernetes ExternalName). */
export const EXTERNAL_NAME_HOSTNAME_MAX_LENGTH = 253;

/**
 * Lowercase RFC-1123 subdomain / hostname used by ExternalName services.
 * Each label is at most 63 characters; full length is checked separately.
 */
export const EXTERNAL_NAME_HOSTNAME_REGEX =
  /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?(\.[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?)*$/;
