import * as _ from 'lodash';

import { t } from '@utils/hooks/useNetworkingTranslation';
import { RouteIngress, RouteKind } from '@utils/types';
import { IngressStatusProps } from '@views/routes/details/utils/types';

export const getIngressStatusForHost = (
  hostname: string,
  ingresses: RouteIngress[],
): IngressStatusProps => {
  return _.find(ingresses, { host: hostname }) as IngressStatusProps;
};

export const showCustomRouteHelp = (
  ingress: RouteIngress,
  annotations: RouteKind['metadata']['annotations'],
): boolean => {
  if (!ingress || !_.some(ingress.conditions, { status: 'True', type: 'Admitted' })) {
    return false;
  }

  if (_.get(annotations, 'openshift.io/host.generated') === 'true') {
    return false;
  }

  return !(!ingress.host || !ingress.routerCanonicalHostname);
};

export const calcTrafficPercentage = (weight: number, route: any) => {
  if (!weight) {
    return '-';
  }

  const totalWeight = _.reduce(
    route.spec.alternateBackends,
    (result, alternate) => {
      return result + alternate.weight;
    },
    route.spec.to.weight,
  );

  const percentage = (weight / totalWeight) * 100;

  return `${percentage.toFixed(1)}%`;
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'True':
      return t('True');
    case 'False':
      return t('False');
    default:
      return status;
  }
};
