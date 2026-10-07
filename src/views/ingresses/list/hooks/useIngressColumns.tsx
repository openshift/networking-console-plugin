import { useMemo } from 'react';

import { IngressModel } from '@utils/models';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { TableColumn, useActiveColumns } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { objectColumnSorting } from '@utils/utils/sorting';
import { tableColumnClasses } from '@views/services/list/hooks/useServiceColumn';

import { sortIngressesByHosts } from '../utils/utils';

type UseIngressColumns = () => { id: string; title: string }[];

const useIngressColumns: UseIngressColumns = () => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<IoK8sApiNetworkingV1Ingress>[] = useMemo(() => {
    return [
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
        sort: (data, direction) => objectColumnSorting(data, direction, null, 'metadata.labels'),
        title: t('Labels'),
        transforms: [sortable],
      },
      {
        id: 'hosts',
        props: { className: tableColumnClasses[3] },
        sort: (data, direction) => data?.sort(sortIngressesByHosts(direction)),
        title: t('Hosts'),
        transforms: [sortable],
      },
      {
        id: '',
        props: { className: tableColumnClasses[4] },
        title: '',
      },
    ];
  }, [t]);

  const [activeColumns] = useActiveColumns<IoK8sApiNetworkingV1Ingress>({
    columnManagementID: IngressModel.kind,
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default useIngressColumns;
