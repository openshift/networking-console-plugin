import { RowFilter } from '@openshift-console/dynamic-plugin-sdk';
import { RoutesStatuses } from '@utils/constants/routes';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteKind } from '@utils/types';

import { getRouteStatus } from '../utils/utils';

const useRouteFilters = (): RowFilter<RouteKind>[] => {
  const { t } = useNetworkingTranslation();

  return [
    {
      filter: ({ selected }, obj) => {
        if (selected?.length === 0) return true;

        const status = getRouteStatus(obj);

        return selected.includes(status);
      },
      filterGroupName: t('Status'),
      items: RoutesStatuses.map((status) => ({ id: status, title: status })),
      reducer: (obj) => getRouteStatus(obj),
      type: 'route-status',
    },
  ];
};

export default useRouteFilters;
