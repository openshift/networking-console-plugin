import * as _ from 'lodash';

import { RoutesStatusesType } from '@utils/constants/routes';
import { t } from '@utils/hooks/useNetworkingTranslation';
import { RouteIngress, RouteKind } from '@utils/types';

export const routeStatus = (route: RouteKind): RoutesStatusesType => {
  let atLeastOneAdmitted = false;

  if (!route.status || !route.status.ingress) {
    return 'Pending';
  }

  _.each(route.status.ingress, (ingress) => {
    const isAdmitted = _.some(ingress.conditions, { status: 'True', type: 'Admitted' });
    if (isAdmitted) {
      atLeastOneAdmitted = true;
    }
  });

  return atLeastOneAdmitted ? 'Accepted' : 'Rejected';
};

export const getRouteHost = (route: RouteKind, onlyAdmitted: boolean): string => {
  let oldestAdmittedIngress: RouteIngress;
  let oldestTransitionTime: string;
  _.each(route.status.ingress, (ingress) => {
    const admittedCondition = _.find(ingress.conditions, { status: 'True', type: 'Admitted' });
    if (
      admittedCondition &&
      (!oldestTransitionTime || oldestTransitionTime > admittedCondition.lastTransitionTime)
    ) {
      oldestAdmittedIngress = ingress;
      oldestTransitionTime = admittedCondition.lastTransitionTime;
    }
  });

  if (oldestAdmittedIngress) {
    return oldestAdmittedIngress.host;
  }

  return onlyAdmitted ? null : route.spec.host;
};

export const isWebRoute = (route: RouteKind): boolean => {
  return !!getRouteHost(route, true) && _.get(route, 'spec.wildcardPolicy') !== 'Subdomain';
};

export const getRouteWebURL = (route: RouteKind): string => {
  const scheme = _.get(route, 'spec.tls.termination') ? 'https' : 'http';
  let url = `${scheme}://${getRouteHost(route, false)}`;
  if (route.spec.path) {
    url += route.spec.path;
  }
  return url;
};

const getSubdomain = (route: RouteKind): string => {
  const hostname = _.get(route, 'spec.host', '');
  return hostname.replace(/^[a-z0-9]([-a-z0-9]*[a-z0-9])\./, '');
};

export const getRouteLabel = (route: RouteKind): string => {
  if (isWebRoute(route)) {
    return getRouteWebURL(route);
  }

  let label = getRouteHost(route, false);
  if (!label) {
    return t('unknown host');
  }

  if (_.get(route, 'spec.wildcardPolicy') === 'Subdomain') {
    label = `*.${getSubdomain(route)}`;
  }

  if (route.spec.path) {
    label += route.spec.path;
  }
  return label;
};

export const sortRoutesByLocation = (direction: string) => (a: RouteKind, b: RouteKind) => {
  const { first, second } = direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

  const firstValue = getRouteLabel(first);
  const secondValue = getRouteLabel(second);

  return firstValue?.localeCompare(secondValue);
};

export const sortRoutesByStatus = (direction: string) => (a: RouteKind, b: RouteKind) => {
  const { first, second } = direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

  const firstValue = routeStatus(first);
  const secondValue = routeStatus(second);

  return firstValue?.localeCompare(secondValue);
};
