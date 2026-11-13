import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { FRRConfigurationModel } from '@utils/models';

import GeneratedResourcesTab from './GeneratedResourcesTab';

const FRRConfigurationsTab: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <GeneratedResourcesTab
      model={FRRConfigurationModel}
      title={t('FRRConfigurations')}
      watchOptions={{
        namespace: 'openshift-frr-k8s',
        selector: { matchLabels: { 'app.kubernetes.io/managed-by': 'bgp-cloud-connector' } },
      }}
    />
  );
};

export default FRRConfigurationsTab;
