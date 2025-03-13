import { useMemo } from 'react';

import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { TableColumn, useActiveColumns } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { objectColumnSorting } from '@utils/utils/sorting';

export const tableColumnClasses = [
  'pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-xl',
  '',
];

const useServiceColumn = (): { id: string; title: string }[] => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<IoK8sApiCoreV1Service>[] = useMemo(
    () => [
      {
        id: 'name',
        props: { className: tableColumnClasses[0] },
        sort: 'metadata.name',
        title: t('Name'),
        transforms: [sortable],
      },
      {
        id: 'namespace',
        props: { className: tableColumnClasses[1] },
        sort: 'metadata.namespace',
        title: t('Namespace'),
        transforms: [sortable],
      },
      {
        id: 'labels',
        props: { className: tableColumnClasses[2] },
        sort: 'metadata.labels',
        title: t('Labels'),
        transforms: [sortable],
      },
      {
        id: 'pod-selector',
        props: { className: tableColumnClasses[3] },
        sort: (data, direction) => objectColumnSorting(data, direction, null, 'spec.selector'),
        title: t('Pod selector'),
        transforms: [sortable],
      },
      {
        id: 'location',
        props: { className: tableColumnClasses[4] },
        sort: 'spec.clusterIP',
        title: t('Location'),
        transforms: [sortable],
      },
      {
        id: '',
        props: { className: 'dropdown-kebab-pf pf-c-table__action' },
        title: '',
      },
    ],
    [t],
  );

  const [activeColumns] = useActiveColumns<IoK8sApiCoreV1Service>({
    columnManagementID: ServiceModel.kind,
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default useServiceColumn;
