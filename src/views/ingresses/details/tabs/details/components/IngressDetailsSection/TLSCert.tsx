import React, { FC } from 'react';

import { SecretModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { getGroupVersionKindForModel, ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type TLSCertProps = {
  ingress: IoK8sApiNetworkingV1Ingress;
};

const TLSCert: FC<TLSCertProps> = ({ ingress }) => {
  const { t } = useNetworkingTranslation();

  if (!ingress?.spec?.tls) {
    return <>{t('Not configured')}</>;
  }

  const certs = ingress.spec.tls.map((tls) => tls.secretName);

  return (
    <>
      <ResourceIcon groupVersionKind={getGroupVersionKindForModel(SecretModel)} />
      <span>{certs.join(', ')}</span>
    </>
  );
};

export default TLSCert;
