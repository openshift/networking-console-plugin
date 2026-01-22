import { useMemo } from 'react';

import { Action, useModal } from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { asAccessReview } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

import DeleteVMNetworkModal, {
  DeleteVMNetworkModalProps,
} from '../components/DeleteVMNetworkModal';
import EditProjectMappingModal, {
  EditProjectMappingModalProps,
} from '../components/EditProjectMappingModal';

const useVMNetworkActions = (obj: ClusterUserDefinedNetworkKind) => {
  const { t } = useNetworkingTranslation();
  const createModal = useModal();

  const actions = useMemo(
    (): Action[] => [
      {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        cta: () => {},
        description: t(
          "To change a network definition, create a new one and reassign VirtualMachines to it. Existing definitions can't be edited directly",
        ),
        disabled: true,
        id: 'edit-vm-network',
        label: t('Edit network definition'),
      },
      {
        accessReview: asAccessReview(ClusterUserDefinedNetworkModel, obj, 'patch'),
        cta: () =>
          createModal<EditProjectMappingModalProps>(EditProjectMappingModal, {
            obj,
          }),
        id: 'edit-vm-network-project-mapping',
        label: t('Edit projects mapping'),
      },
      {
        accessReview: asAccessReview(ClusterUserDefinedNetworkModel, obj, 'delete'),
        cta: () =>
          createModal<DeleteVMNetworkModalProps>(DeleteVMNetworkModal, {
            obj,
          }),
        id: 'delete-vm-network',
        label: t('Delete'),
      },
    ],
    [obj, t, createModal],
  );

  return actions;
};

export default useVMNetworkActions;
