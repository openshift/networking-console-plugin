import { useMemo } from 'react';

import {
  K8sResourceCommon,
  TableColumn,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getTopology } from '@utils/resources/udns/selectors';

const sortUDNTopologies = (direction: string) => (a: K8sResourceCommon, b: K8sResourceCommon) => {
  const { first, second } = direction === 'asc' ? { first: a, second: b } : { first: b, second: a };
  const firstTopology = getTopology(first);
  const secondTopology = getTopology(second);

  return firstTopology?.localeCompare(secondTopology, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

const useUDNColumns = (): { id: string; title: string }[] => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<K8sResourceCommon>[] = useMemo(
    () => [
      {
        id: 'name',
        sort: 'metadata.name',
        title: t('Name'),
        transforms: [sortable],
      },
      {
        id: 'namespace',
        sort: 'metadata.namespace',
        title: t('Namespace'),
        transforms: [sortable],
      },
      {
        id: 'topology',
        sort: (data, direction) => data?.sort(sortUDNTopologies(direction)),
        title: t('Topology'),
        transforms: [sortable],
      },
      {
        id: '',
        props: { className: 'dropdown-kebab-pf pf-v5-c-table__action' },
        title: '',
      },
    ],
    [t],
  );

  const [activeColumns] = useActiveColumns<K8sResourceCommon>({
    columnManagementID: '',
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default useUDNColumns;