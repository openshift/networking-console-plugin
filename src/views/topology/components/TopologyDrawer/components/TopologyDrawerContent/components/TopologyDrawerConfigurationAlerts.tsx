import React, { FC } from 'react';

import { Alert, AlertGroup } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';
import { useTopologyContext } from '@views/topology/context/TopologyContext';

import { getTopologyDrawerAlerts } from '../utils/getTopologyDrawerAlerts';

const TopologyDrawerConfigurationAlerts: FC = () => {
  const { t } = useNetworkingTranslation();
  const { resources, selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  const alerts = getTopologyDrawerAlerts(selectedNode, resources, t);
  if (isEmpty(alerts)) return null;

  return (
    <div className="topology-drawer__alerts">
      <AlertGroup className="pf-v6-u-mb-md" isLiveRegion>
        {alerts.map(({ key, message, title, variant }) => (
          <Alert isInline key={key} title={title} variant={variant}>
            {message}
          </Alert>
        ))}
      </AlertGroup>
    </div>
  );
};

export default TopologyDrawerConfigurationAlerts;
