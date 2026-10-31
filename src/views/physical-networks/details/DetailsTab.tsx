import React, { FC } from 'react';
import { Link } from 'react-router';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NodeNetworkConfigurationPolicyModel } from '@utils/models';
import { getResourceURL } from '@utils/resources/shared';
import { NO_DATA_DASH } from '@utils/utils/constants';

import { ConfigurationDetails } from '../utils/types';

type DetailsTabProps = {
  nmstateFrontendAvailable: boolean;
  selectedConfiguration: ConfigurationDetails;
};

const DetailsTab: FC<DetailsTabProps> = ({ nmstateFrontendAvailable, selectedConfiguration }) => {
  const { t } = useNetworkingTranslation();

  const configurationName =
    nmstateFrontendAvailable && selectedConfiguration?.nncp ? (
      <Link
        to={getResourceURL({
          model: NodeNetworkConfigurationPolicyModel,
          resource: selectedConfiguration.nncp,
        })}
      >
        {selectedConfiguration.configurationName}
      </Link>
    ) : (
      selectedConfiguration?.configurationName
    );

  const fields: Array<{ label: string; value: number | React.ReactNode | string }> = [
    { label: t('Network name'), value: selectedConfiguration?.physicalNetworkName },
    { label: t('Configuration name'), value: configurationName },
    { label: t('Description'), value: selectedConfiguration?.description },
    { label: t('Uplink connection'), value: selectedConfiguration?.uplink },
    { label: t('Aggregation mode'), value: selectedConfiguration?.aggregationMode },
    { label: t('MTU'), value: selectedConfiguration?.mtu },
  ];

  return (
    <DescriptionList className="pf-v6-u-my-xl">
      {fields.map(({ label, value }) => (
        <DescriptionListGroup key={label}>
          <DescriptionListTerm>{label}</DescriptionListTerm>
          <DescriptionListDescription>{value ?? NO_DATA_DASH}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};

export default DetailsTab;
