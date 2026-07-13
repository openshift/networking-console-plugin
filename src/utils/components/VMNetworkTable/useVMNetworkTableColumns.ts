import { useCallback, useMemo, useState } from 'react';
import { TFunction } from 'i18next';

import { ColumnManagementModalColumn } from '@patternfly/react-component-groups';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { VM_NETWORK_TABLE_COLUMN_IDS } from './constants';

export const getDefaultVMNetworkTableColumns = (t: TFunction): ColumnManagementModalColumn[] => [
  {
    isShown: true,
    isShownByDefault: true,
    isUntoggleable: true,
    key: VM_NETWORK_TABLE_COLUMN_IDS.NAME,
    title: t('Name'),
  },
  {
    isShown: true,
    isShownByDefault: true,
    key: VM_NETWORK_TABLE_COLUMN_IDS.NAMESPACE,
    title: t('Namespace'),
  },
  {
    isShown: true,
    isShownByDefault: true,
    key: VM_NETWORK_TABLE_COLUMN_IDS.STATUS,
    title: t('Status'),
  },
  {
    isShown: true,
    isShownByDefault: true,
    key: VM_NETWORK_TABLE_COLUMN_IDS.INTERFACE,
    title: t('Interface'),
  },
  {
    isShown: false,
    isShownByDefault: false,
    key: VM_NETWORK_TABLE_COLUMN_IDS.CREATED,
    title: t('Created'),
  },
  {
    isShown: false,
    isShownByDefault: false,
    key: VM_NETWORK_TABLE_COLUMN_IDS.MEMORY,
    title: t('Memory'),
  },
  {
    isShown: false,
    isShownByDefault: false,
    key: VM_NETWORK_TABLE_COLUMN_IDS.CPU,
    title: t('CPU'),
  },
  {
    isShown: false,
    isShownByDefault: false,
    key: VM_NETWORK_TABLE_COLUMN_IDS.CONDITIONS,
    title: t('Conditions'),
  },
  {
    isShown: false,
    isShownByDefault: false,
    key: VM_NETWORK_TABLE_COLUMN_IDS.DELETION_PROTECTION,
    title: t('Deletion protection'),
  },
];

const useVMNetworkTableColumns = () => {
  const { t } = useNetworkingTranslation();
  const [appliedColumns, setAppliedColumns] = useState(() => getDefaultVMNetworkTableColumns(t));

  const resetColumns = useCallback(() => {
    setAppliedColumns(getDefaultVMNetworkTableColumns(t));
  }, [t]);

  const visibleColumnKeys = useMemo(
    () => appliedColumns.filter((column) => column.isShown).map((column) => column.key),
    [appliedColumns],
  );

  const columnCount = visibleColumnKeys.length + 1;

  return {
    appliedColumns,
    applyColumns: setAppliedColumns,
    columnCount,
    resetColumns,
    visibleColumnKeys,
  };
};

export default useVMNetworkTableColumns;
