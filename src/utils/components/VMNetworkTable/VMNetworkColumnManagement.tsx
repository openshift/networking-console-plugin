import React, { FC, useState } from 'react';

import {
  ColumnManagementModal,
  ColumnManagementModalColumn,
} from '@patternfly/react-component-groups';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { ColumnsIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type VMNetworkColumnManagementProps = {
  appliedColumns: ColumnManagementModalColumn[];
  applyColumns: (newColumns: ColumnManagementModalColumn[]) => void;
  onReset: () => void;
  ouiaId?: string;
};

const VMNetworkColumnManagement: FC<VMNetworkColumnManagementProps> = ({
  appliedColumns,
  applyColumns,
  onReset,
  ouiaId = 'vm-network-column-management',
}) => {
  const { t } = useNetworkingTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ColumnManagementModal
        appliedColumns={appliedColumns}
        applyColumns={applyColumns}
        description={t('Selected categories will be displayed in the table.')}
        enableDragDrop
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onReset={onReset}
        ouiaId={ouiaId}
        resetToDefaultLabel={t('Reset to default')}
        title={t('Manage columns')}
      />
      <Button
        aria-label={t('Manage columns')}
        icon={<ColumnsIcon />}
        onClick={() => setIsOpen(true)}
        ouiaId={`${ouiaId}-button`}
        variant={ButtonVariant.plain}
      />
    </>
  );
};

export default VMNetworkColumnManagement;
