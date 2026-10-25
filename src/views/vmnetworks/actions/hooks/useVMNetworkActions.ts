import { useMemo } from 'react';

import { Action, useDeleteModal, useModal } from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { asAccessReview } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

import EditProjectMappingModal, {
  EditProjectMappingModalProps,
} from '../components/EditProjectMappingModal';

const useVMNetworkActions = (obj: ClusterUserDefinedNetworkKind) => {
  const { t } = useNetworkingTranslation();
  const createModal = useModal();

  const launchDeleteModal = useDeleteModal(obj);

  const actions = useMemo(
    (): Action[] => [
      {
        cta: () => {},
        description: t(
          "To change a network definition, create a new one and reassign VirtualMachines to it. Existing definitions can't be edited directly",
        ),
        disabled: true,
        id: 'edit-vm-network',
        label: t('Edit VirtualMachine network'),
      },
      {
        accessReview: asAccessReview(ClusterUserDefinedNetworkModel, obj, 'patch'),
        cta: () =>
          createModal<EditProjectMappingModalProps>(EditProjectMappingModal, {
            obj,
          }),
        id: 'edit-vm-network-project-mapping',
        label: t('Edit project mapping'),
      },
      {
        accessReview: asAccessReview(ClusterUserDefinedNetworkModel, obj, 'delete'),
        cta: launchDeleteModal,
        id: 'delete-vm-network',
        label: t('Delete VirtualMachine network'),
      },
    ],
    [obj, t, launchDeleteModal, createModal],
  );

  return actions;
};

export default useVMNetworkActions;
