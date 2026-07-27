export const NAME_FIELD_ID = 'service-name';
export const NAMESPACE_FIELD_ID = 'service-namespace';
export const SERVICE_TYPE_FIELD_ID = 'service-type';
export const SELECTOR_FIELD_ID = 'service-selector';
export const PORTS_FIELD_ID = 'service-ports';

export const SERVICE_TYPES = ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
