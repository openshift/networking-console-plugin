import { useMemo } from 'react';

import { modelToGroupVersionKind, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { useEndpointHealth } from '@utils/hooks/useEndpointHealth';
import { getNamespace } from '@utils/resources/shared';
import { RouteKind, RouteWithHealth } from '@utils/types';

export type UseRouteListViewDataResult = {
  data: RouteWithHealth[];
  error: any;
  loaded: boolean;
};

/**
 * Fetch and aggregate Routes with the endpoint health of each Route's backing Service.
 *
 * Data path:
 *   Route spec.to.name
 *   -> Service
 *   -> EndpointSlice (label: kubernetes.io/service-name)
 *   -> endpoints[].conditions.ready -> aggregate ready/total
 */
export const useRouteListViewData = (namespace: string): UseRouteListViewDataResult => {
  const [routes, routesLoaded, routesError] = useK8sWatchResource<RouteKind[]>({
    groupVersionKind: modelToGroupVersionKind(RouteModel),
    isList: true,
    namespace,
  });

  const { healthMap } = useEndpointHealth(namespace);

  const data = useMemo<RouteWithHealth[]>(
    () =>
      routes?.map((route) => {
        const healthKey = `${getNamespace(route)}/${route.spec.to.name}`;
        const health = healthMap[healthKey] ?? undefined;
        return {
          ...route,
          _backendHealth: health,
        };
      }) ?? [],
    [routes, healthMap],
  );

  return {
    data,
    error: routesError,
    loaded: routesLoaded,
  };
};
