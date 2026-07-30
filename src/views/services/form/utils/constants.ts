export const SERVICE_TYPES = ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const NAME_FIELD_ID = 'service-name';
export const NAMESPACE_FIELD_ID = 'service-namespace';
export const SERVICE_TYPE_FIELD_ID = 'service-type';
export const EXTERNAL_NAME_FIELD_ID = 'service-external-name';
export const SELECTOR_FIELD_ID = 'service-selector';
export const PORTS_FIELD_ID = 'service-ports';

/** RFC-1123 subdomain / hostname used by ExternalName services. */
export const EXTERNAL_NAME_HOSTNAME_REGEX =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)+$/i;
