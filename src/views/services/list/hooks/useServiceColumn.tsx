import { useMemo } from 'react';

import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { TableColumn, useActiveColumns } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ServiceWithHealth } from '@utils/types';
import { objectColumnSorting, sortByEndpointHealthStatus } from '@utils/utils/sorting';

import { sortServicesByLocation } from '../utils/utils';

export const tableColumnClasses = [
  'pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-xl',
  '',
];

const useServiceColumn = (): { id: string; title: string }[] => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<ServiceWithHealth>[] = useMemo(
    () => [
      {
        id: 'name',
        props: { className: tableColumnClasses[0] },
        sort: 'metadata.name',
        title: t('Name'),
        transforms: [sortable],
      },
      {
        id: 'health',
        props: { className: tableColumnClasses[1] },
        sort: (data, direction) => sortByEndpointHealthStatus(data, '_health', direction),
        title: t('Health'),
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
        id: 'labels',
        props: { className: tableColumnClasses[3] },
        sort: 'metadata.labels',
        title: t('Labels'),
        transforms: [sortable],
      },
      {
        id: 'pod-selector',
        props: { className: tableColumnClasses[4] },
        sort: (data, direction) => objectColumnSorting(data, direction, null, 'spec.selector'),
        title: t('Pod selector'),
        transforms: [sortable],
      },
      {
        id: 'location',
        props: { className: tableColumnClasses[5] },
        sort: (data, direction) => sortServicesByLocation(data, direction),
        title: t('Location'),
        transforms: [sortable],
      },
      {
        id: '',
        props: { className: 'pf-c-table__action' },
        title: '',
      },
    ],
    [t],
  );

  const [activeColumns] = useActiveColumns<ServiceWithHealth>({
    columnManagementID: ServiceModel.kind,
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default useServiceColumn;
