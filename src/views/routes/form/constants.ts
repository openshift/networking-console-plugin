import { t } from '@utils/hooks/useNetworkingTranslation';
import { getGroupVersionKindForModel, ServiceModel } from '@utils/models';

export const PASSTHROUGH = 'passthrough';
export const RE_ENCRYPT = 'reencrypt';
export const EDGE = 'edge';

export const terminationTypes = {
  [EDGE]: t('Edge'),
  [PASSTHROUGH]: t('Passthrough'),
  [RE_ENCRYPT]: t('Re-encrypt'),
};

export const insecureTrafficTypes = {
  Allow: t('Allow'),
  None: t('None'),
  Redirect: t('Redirect'),
};

export const passthroughInsecureTrafficTypes = {
  None: t('None'),
  Redirect: t('Redirect'),
};

export const ServiceGroupVersionKind = getGroupVersionKindForModel(ServiceModel);

export const NAME_FIELD_ID = 'name';
export const HOST_FIELD_ID = 'host';
export const PATH_FIELD_ID = 'path';
export const SERVICE_FIELD_ID = 'service';
export const SERVICE_WEIGHT_FIELD_ID = 'service-weight';

export const DEFAULT_SERVICE_WEIGHT = 100;
export const SECURITY_FIELD_ID = 'security';
export const AS_PREFIX_FIELD_ID = 'alternate-service-';
export const AS_WEIGHT_PREFIX_FIELD_ID = 'alternate-service-weight-';
export const TLS_TERMINATION_FIELD_ID = 'tls-termination';
export const TLS_TERMINATION_POLICY_FIELD_ID = 'tls-insecureEdgeTerminationPolicy';
export const CERTIFICATE_FIELD_ID = 'certificate';
export const CA_CERTIFICATE_FIELD_ID = 'ca-certificate';
export const DESTINATION_CA_CERT_FIELD_ID = 'destination-ca-certificate';
export const KEY_FIELD_ID = 'key';
