import React, { FC, ReactElement } from 'react';
import { TFunction } from 'i18next';

import { Flex, FlexItem, Icon, Tooltip } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { EndpointHealthStatus, ServiceEndpointHealth } from '@utils/types';

type HealthIconConfig = {
  ariaLabel: string;
  icon: ReactElement;
  label: string;
  pfStatus?: 'custom' | 'danger' | 'success' | 'warning';
};

const getHealthIconConfig = (
  health: ServiceEndpointHealth | undefined,
  t: TFunction,
): HealthIconConfig => {
  const { ready, status, total } = health || {};
  const count = `${ready}/${total}`;

  switch (status) {
    case EndpointHealthStatus.Healthy:
      return {
        ariaLabel: t('Healthy: {{ready}} of {{total}} endpoints ready', { ready, total }),
        icon: <CheckCircleIcon />,
        label: count,
        pfStatus: 'success',
      };
    case EndpointHealthStatus.Degraded:
      return {
        ariaLabel: t('Degraded: {{ready}} of {{total}} endpoints ready', { ready, total }),
        icon: <ExclamationTriangleIcon />,
        label: count,
        pfStatus: 'warning',
      };
    case EndpointHealthStatus.Down:
      return {
        ariaLabel: t('Down: {{ready}} of {{total}} endpoints ready', { ready, total }),
        icon: <ExclamationCircleIcon />,
        label: count,
        pfStatus: 'danger',
      };
    case EndpointHealthStatus.Unknown:
      return {
        ariaLabel: t('Unknown: endpoint readiness not available'),
        icon: <QuestionCircleIcon />,
        label: t('Unknown'),
        pfStatus: undefined,
      };
    default:
      return {
        ariaLabel: t('Unknown: endpoint readiness not loaded'),
        icon: <QuestionCircleIcon />,
        label: t('Unknown'),
        pfStatus: undefined,
      };
  }
};

export type ServiceEndpointStatusIconProps = {
  health: ServiceEndpointHealth | undefined;
};

const ServiceEndpointStatusIcon: FC<ServiceEndpointStatusIconProps> = ({ health }) => {
  const { t } = useNetworkingTranslation();
  const { ariaLabel, icon, label, pfStatus } = getHealthIconConfig(health, t);

  return (
    <Tooltip content={ariaLabel}>
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        display={{ default: 'inlineFlex' }}
        gap={{ default: 'gapXs' }}
      >
        <FlexItem>
          <Icon aria-label={ariaLabel} status={pfStatus}>
            {icon}
          </Icon>
        </FlexItem>
        <FlexItem>
          <span aria-hidden="true">{label}</span>
        </FlexItem>
      </Flex>
    </Tooltip>
  );
};

export default ServiceEndpointStatusIcon;
