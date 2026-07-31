import { useMemo } from 'react';

import { RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import { TableColumn, useActiveColumns } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteWithHealth } from '@utils/types';
import { sortByEndpointHealthStatus } from '@utils/utils/sorting';

import { sortRoutesByLocation, sortRoutesByStatus } from '../utils/utils';

export const tableColumnClasses = [
  'pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-xl',
  '',
];

type UseRouteColumns = () => { id: string; title: string }[];

const useRouteColumns: UseRouteColumns = () => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<RouteWithHealth>[] = useMemo(
    () => [
      {
        id: 'name',
        props: { className: tableColumnClasses[0] },
        sort: 'metadata.name',
        title: t('Name'),
        transforms: [sortable],
      },
      {
        id: 'backend-health',
        props: { className: tableColumnClasses[1] },
        sort: (data, direction) => sortByEndpointHealthStatus(data, '_backendHealth', direction),
        title: t('Backend health'),
        transforms: [sortable],
      },
      {
        id: 'namespace',
        props: { className: tableColumnClasses[2] },
        sort: 'metadata.namespace',
        title: t('Namespace'),
        transforms: [sortable],
      },
      {
        id: 'status',
        props: { className: tableColumnClasses[3] },
        sort: (data, direction) => data?.sort(sortRoutesByStatus(direction)),
        title: t('Status'),
        transforms: [sortable],
      },
      {
        id: 'location',
        props: { className: tableColumnClasses[4] },
        sort: (data, direction) => data?.sort(sortRoutesByLocation(direction)),
        title: t('Location'),
        transforms: [sortable],
      },
      {
        id: 'service',
        props: { className: tableColumnClasses[5] },
        sort: 'spec.to.name',
        title: t('Service'),
        transforms: [sortable],
      },
      {
        id: '',
        props: { className: tableColumnClasses[6] },
        title: '',
      },
    ],
    [t],
  );

  const [activeColumns] = useActiveColumns<RouteWithHealth>({
    columnManagementID: RouteModel.kind,
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default useRouteColumns;
