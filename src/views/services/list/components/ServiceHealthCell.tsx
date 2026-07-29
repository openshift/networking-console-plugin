import React, { FC } from 'react';

import ServiceEndpointStatusIcon from '@utils/components/Icons/ServiceEndpointStatusIcon';
import { SERVICE_TYPE_EXTERNAL_NAME } from '@utils/constants/services';
import { EndpointHealthStatus, ServiceWithHealth } from '@utils/types';

type ServiceHealthCellProps = {
  obj: ServiceWithHealth;
};

const ServiceHealthCell: FC<ServiceHealthCellProps> = ({ obj }) => {
  const health =
    obj.spec?.type === SERVICE_TYPE_EXTERNAL_NAME
      ? { ready: 0, status: EndpointHealthStatus.Unknown, total: 0 }
      : obj._health;

  return <ServiceEndpointStatusIcon health={health} />;
};

export default ServiceHealthCell;
