import React, { FC } from 'react';

import { Alert, AlertGroup } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { isDegraded } from '../utils/sourceStates';
import { PhysicalNetworksSources } from '../utils/types';

type SourceStateAlertsProps = {
  sources: PhysicalNetworksSources;
};

const SourceStateAlerts: FC<SourceStateAlertsProps> = ({ sources }) => {
  const { t } = useNetworkingTranslation();

  const messages: Array<{ key: keyof PhysicalNetworksSources; message: string }> = [
    {
      key: 'nads',
      message: t(
        'Physical network definitions could not be loaded. Other sources are still shown.',
      ),
    },
    { key: 'nncps', message: t('NMState policy information is unavailable.') },
    { key: 'nnces', message: t('NMState enactment information is unavailable.') },
    { key: 'nodeNetworkStates', message: t('Observed network mappings are unavailable.') },
    { key: 'nodes', message: t('Node information is unavailable.') },
    {
      key: 'pods',
      message: t('Pod information is unavailable; consumer information is incomplete.'),
    },
    {
      key: 'virtualMachines',
      message: t('Virtual machine information is unavailable; consumer information is incomplete.'),
    },
  ];

  const degradedMessages = messages.filter(({ key }) => isDegraded(sources[key]));
  if (degradedMessages.length === 0) return null;

  return (
    <AlertGroup className="pf-v6-u-mb-lg" isLiveRegion>
      {degradedMessages.map(({ key, message }) => (
        <Alert isInline key={key} title={message} variant="warning" />
      ))}
    </AlertGroup>
  );
};

export default SourceStateAlerts;
