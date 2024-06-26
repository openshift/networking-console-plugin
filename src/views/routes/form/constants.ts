import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { t } from '@utils/hooks/useNetworkingTranslation';

export const PASSTHROUGH = 'passthrough';

export const terminationTypes = {
  edge: t('Edge'),
  [PASSTHROUGH]: t('Passthrough'),
  reencrypt: t('Re-encrypt'),
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

export const ServiceGroupVersionKind = modelToGroupVersionKind(ServiceModel);

export const NAME_FIELD_ID = 'name';
export const HOST_FIELD_ID = 'host';
export const PATH_FIELD_ID = 'path';
export const SERVICE_FIELD_ID = 'host';
export const SECURITY_FIELD_ID = 'security';
export const AS_PREFIX_FIELD_ID = 'alternate-service-';
export const AS_WEIGHT_PREFIX_FIELD_ID = 'alternate-service-weight-';
export const TLS_TERMINATION_FIELD_ID = 'tls-termination';
export const TLS_TERMINATION_POLICY_FIELD_ID = 'tls-insecureEdgeTerminationPolicy';
export const CERTIFICATE_FIELD_ID = 'certificate';
export const CA_CERTIFICATE_FIELD_ID = 'ca-certificate';
export const KEY_FIELD_ID = 'key';
