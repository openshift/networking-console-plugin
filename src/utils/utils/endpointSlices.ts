import { getNamespace } from '@utils/resources/shared';
import { EndpointHealthStatus, EndpointSliceKind, ServiceEndpointHealth } from '@utils/types';

/**
 * Aggregates all EndpointSlices provided into a per-service health map.
 *
 * Data path:
 *   EndpointSlice (discovery.k8s.io/v1, label: kubernetes.io/service-name)
 *   -> endpoints[].conditions.ready
 *   -> aggregate ready/total per service name
 */
export const aggregateEndpointSliceHealth = (
  endpointSlices: EndpointSliceKind[],
): Record<string, ServiceEndpointHealth> => {
  if (!endpointSlices?.length) return {};

  const totals: Record<string, { ready: number; total: number }> = {};

  for (const slice of endpointSlices) {
    const serviceName = slice.metadata?.labels?.['kubernetes.io/service-name'];
    if (!serviceName) continue;

    const healthKey = `${getNamespace(slice)}/${serviceName}`;

    if (!totals[healthKey]) {
      totals[healthKey] = { ready: 0, total: 0 };
    }

    for (const endpoint of slice.endpoints ?? []) {
      totals[healthKey].total += 1;
      if (endpoint.conditions?.ready !== false) {
        totals[healthKey].ready += 1;
      }
    }
  }

  const result: Record<string, ServiceEndpointHealth> = {};

  for (const [healthKey, { ready, total }] of Object.entries(totals)) {
    let status: EndpointHealthStatus;

    if (total === 0) {
      status = EndpointHealthStatus.Unknown;
    } else if (ready === total) {
      status = EndpointHealthStatus.Healthy;
    } else if (ready > 0) {
      status = EndpointHealthStatus.Degraded;
    } else {
      status = EndpointHealthStatus.Down;
    }

    result[healthKey] = { ready, status, total };
  }

  return result;
};
