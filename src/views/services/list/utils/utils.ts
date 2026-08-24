import { SortByDirection } from '@patternfly/react-table';
import { ServiceWithHealth } from '@utils/types';

const getServiceLocationSortValue = (service: ServiceWithHealth): string => {
  switch (service?.spec?.type) {
    case 'LoadBalancer': {
      const ingress = service?.status?.loadBalancer?.ingress?.[0];
      return ingress?.hostname || ingress?.ip || '';
    }
    case 'ExternalName':
      return service?.spec?.externalName || '';
    default:
      return service?.spec?.clusterIP || '';
  }
};

export const sortServicesByLocation = (data: ServiceWithHealth[], direction: SortByDirection) => {
  const compareFunction = (a: ServiceWithHealth, b: ServiceWithHealth) => {
    const aValue = getServiceLocationSortValue(a);
    const bValue = getServiceLocationSortValue(b);

    return (
      (direction === SortByDirection.asc ? 1 : -1) *
      aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
    );
  };

  return data.sort(compareFunction);
};
