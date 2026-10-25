import React, { FC } from 'react';

import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { RouteKind } from '@utils/types';

import { getRouteStatus } from '../utils/utils';

type RouteStatusProps = {
  route: RouteKind;
};

const RouteStatus: FC<RouteStatusProps> = ({ route }) => {
  const status: string = getRouteStatus(route);

  return <Status status={status} />;
};

export default RouteStatus;
