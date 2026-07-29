import { useMemo } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { EndPointSliceModel } from '@utils/models';
import { EndpointSliceKind, ServiceEndpointHealth } from '@utils/types';
import { aggregateEndpointSliceHealth } from '@utils/utils/endpointSlices';

export type UseEndpointHealthResult = {
  error: any;
  healthMap: Record<string, ServiceEndpointHealth>;
  loaded: boolean;
};

export const useEndpointHealth = (namespace: string): UseEndpointHealthResult => {
  const [endpointSlices, loaded, error] = useK8sWatchResource<EndpointSliceKind[]>({
    groupVersionKind: modelToGroupVersionKind(EndPointSliceModel),
    isList: true,
    namespace,
  });

  const healthMap = useMemo(() => aggregateEndpointSliceHealth(endpointSlices), [endpointSlices]);

  return { error, healthMap, loaded };
};
