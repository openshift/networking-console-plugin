import React, { FC } from 'react';

import ServiceEndpointStatusIcon from '@utils/components/Icons/ServiceEndpointStatusIcon';
import { RouteWithHealth } from '@utils/types';

type RouteBackendHealthCellProps = {
  obj: RouteWithHealth;
};

const RouteBackendHealthCell: FC<RouteBackendHealthCellProps> = ({ obj }) => {
  const health = obj._backendHealth;

  return <ServiceEndpointStatusIcon health={health} />;
};

export default RouteBackendHealthCell;
