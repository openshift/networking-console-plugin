import { useCallback } from 'react';

import { NetworkPolicyModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { TableColumn, useActiveColumns } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { PaginationState } from '@utils/hooks/usePagination/utils/types';
import { columnSorting, objectColumnSorting } from '@utils/utils/sorting';

type UseNetworkPolicyListColumnsValues = [
  columns: TableColumn<IoK8sApiNetworkingV1NetworkPolicy>[],
  activeColumns: TableColumn<IoK8sApiNetworkingV1NetworkPolicy>[],
];

type UseNetworkPolicyListColumns = (
  pagination: PaginationState,
  data: IoK8sApiNetworkingV1NetworkPolicy[],
) => UseNetworkPolicyListColumnsValues;

const useNetworkPolicyColumn: UseNetworkPolicyListColumns = (pagination, data) => {
  const { t } = useNetworkingTranslation();

  const sorting = useCallback(
    (direction, path) => columnSorting(data, direction, pagination, path),
    [data, pagination],
  );

  const sortingObjects = useCallback(
    (direction, path) => objectColumnSorting(data, direction, pagination, path),
    [data, pagination],
  );

  const columns: TableColumn<IoK8sApiNetworkingV1NetworkPolicy>[] = [
    {
      id: 'name',
      sort: (_, direction) => sorting(direction, 'metadata.name'),
      title: t('Name'),
      transforms: [sortable],
    },
    {
      id: 'namespace',
      sort: (_, direction) => sorting(direction, 'metadata.namespace'),
      title: t('Namespace'),
      transforms: [sortable],
    },
    {
      id: 'pod-selector',
      props: { className: 'pf-m-hidden pf-m-visible-on-md' },
      sort: (_, direction) => sortingObjects(direction, 'spec.podSelector.matchLabels'),
      title: t('Pod selector'),
      transforms: [sortable],
    },
    {
      id: '',
      props: { className: 'dropdown-kebab-pf pf-v6-c-table__action' },
      title: '',
    },
  ];

  const [activeColumns] = useActiveColumns<IoK8sApiNetworkingV1NetworkPolicy>({
    columnManagementID: NetworkPolicyModel.kind,
    columns,
    showNamespaceOverride: false,
  });

  return [columns, activeColumns];
};

export default useNetworkPolicyColumn;
