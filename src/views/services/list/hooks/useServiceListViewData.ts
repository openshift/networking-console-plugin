import { useMemo } from 'react';

import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { useEndpointHealth } from '@utils/hooks/useEndpointHealth';
import { getName, getNamespace } from '@utils/resources/shared';
import { ServiceWithHealth } from '@utils/types';

export type UseServiceListViewDataResult = {
  data: ServiceWithHealth[];
  error: any;
  loaded: boolean;
};

/**
 * Fetch and aggregate Services with the endpoint health status for each Service.
 *
 * Data path:
 *   Service
 *   -> EndpointSlice (label: kubernetes.io/service-name)
 *   -> endpoints[].conditions.ready -> aggregate ready/total
 */
export const useServiceListViewData = (namespace: string): UseServiceListViewDataResult => {
  const [services, servicesLoaded, servicesError] = useK8sWatchResource<IoK8sApiCoreV1Service[]>({
    groupVersionKind: modelToGroupVersionKind(ServiceModel),
    isList: true,
    namespace,
  });

  const { healthMap } = useEndpointHealth(namespace);

  const data = useMemo<ServiceWithHealth[]>(
    () =>
      services?.map((service) => {
        const healthKey = `${getNamespace(service)}/${getName(service)}`;
        const health = healthMap[healthKey] ?? undefined;
        return {
          ...service,
          _health: health,
        };
      }) ?? [],
    [services, healthMap],
  );

  return {
    data,
    error: servicesError,
    loaded: servicesLoaded,
  };
};
