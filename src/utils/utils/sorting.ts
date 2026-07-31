import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { SortByDirection } from '@patternfly/react-table';
import { PaginationState } from '@utils/hooks/usePagination/utils/types';
import { EndpointHealthStatus, ServiceEndpointHealth } from '@utils/types';

const getValueByPath = (obj: K8sResourceCommon, path: string) => {
  const pathArray = path?.split('.');
  return pathArray?.reduce((acc, field) => acc?.[field], obj);
};

export const sortCommonColumnsByPath = (path: string, direction: string) => (a, b) => {
  const { first, second } = direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

  return getValueByPath(first, path)
    ?.toString()
    ?.localeCompare(getValueByPath(second, path)?.toString(), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
};

export const columnSorting = <T>(
  data: T[],
  direction: string,
  pagination: PaginationState,
  path: string,
) => {
  const { endIndex, startIndex } = pagination;
  const predicate = (a: T, b: T) => {
    const { first, second } =
      direction === 'asc' ? { first: a, second: b } : { first: b, second: a };
    return getValueByPath(first, path)
      ?.toString()
      ?.localeCompare(getValueByPath(second, path)?.toString(), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
  };
  return data?.sort(predicate)?.slice(startIndex, endIndex);
};

export const objectColumnSorting = <T extends K8sResourceCommon>(
  data: T[],
  direction: string,
  pagination: PaginationState,
  selectorPath: string,
) => {
  const endIndex = pagination?.endIndex || data.length;
  const startIndex = pagination?.startIndex || 0;

  const sortMethod = (a: T, b: T) => {
    const { first, second } =
      direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

    const firstValue = getValueByPath(first, selectorPath);
    const secondValue = getValueByPath(second, selectorPath);

    const firstValueString = Object.entries(firstValue || {})
      .map(([key, label]) => `${key}=${label.toString()}`)
      .join(',');
    const secondValueString = Object.entries(secondValue || {})
      .map(([key, label]) => `${key}=${label.toString()}`)
      .join(',');

    return firstValueString.localeCompare(secondValueString, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };

  return data?.sort(sortMethod)?.slice(startIndex, endIndex);
};

const ENDPOINT_HEALTH_STATUS_SORT_ORDER: Record<EndpointHealthStatus, number> = {
  [EndpointHealthStatus.Degraded]: 1,
  [EndpointHealthStatus.Down]: 2,
  [EndpointHealthStatus.Healthy]: 0,
  [EndpointHealthStatus.Unknown]: 3,
};

const getServiceEndpointHealthSortOrder = (value: ServiceEndpointHealth) =>
  ENDPOINT_HEALTH_STATUS_SORT_ORDER[value?.status ?? EndpointHealthStatus.Unknown];

export const sortByEndpointHealthStatus = <T, K extends keyof T>(
  data: T[],
  statusField: K,
  direction: SortByDirection,
) => {
  const compareFunction = (a: T, b: T) => {
    const aValue = a[statusField] as ServiceEndpointHealth;
    const bValue = b[statusField] as ServiceEndpointHealth;

    return (
      (direction === 'asc' ? 1 : -1) *
      (getServiceEndpointHealthSortOrder(aValue) - getServiceEndpointHealthSortOrder(bValue))
    );
  };

  return data.sort(compareFunction);
};
