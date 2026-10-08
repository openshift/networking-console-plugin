import { useMemo } from 'react';

import { TableColumn, useActiveColumns } from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { IngressModel } from '@utils/models';
import { Ingress } from '@utils/types/k8sTypes';
import { objectColumnSorting } from '@utils/utils/sorting';
import { tableColumnClasses } from '@views/services/list/hooks/useServiceColumn';

import { sortIngressesByHosts } from '../utils/utils';

type UseIngressColumns = () => { id: string; title: string }[];

const useIngressColumns: UseIngressColumns = () => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<Ingress>[] = useMemo(() => {
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

  const [activeColumns] = useActiveColumns<Ingress>({
    columnManagementID: IngressModel.kind,
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default useIngressColumns;
