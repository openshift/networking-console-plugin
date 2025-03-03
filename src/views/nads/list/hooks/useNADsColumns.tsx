import { useMemo } from 'react';

import {
  K8sResourceCommon,
  TableColumn,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getConfigAsJSON, getType } from '@utils/resources/nads/selectors';

const sortNADTypes = (direction: string) => (a: K8sResourceCommon, b: K8sResourceCommon) => {
  const { first, second } = direction === 'asc' ? { first: a, second: b } : { first: b, second: a };
  const firstType = getType(getConfigAsJSON(first));
  const secondType = getType(getConfigAsJSON(second));

  return firstType?.localeCompare(secondType, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

const useNADsColumns = (): { id: string; title: string }[] => {
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
        id: 'type',
        sort: (data, direction) => data?.sort(sortNADTypes(direction)),
        title: t('Type'),
        transforms: [sortable],
      },
      {
        id: '',
        props: { className: 'dropdown-kebab-pf pf-v6-c-table__action' },
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

export default useNADsColumns;
