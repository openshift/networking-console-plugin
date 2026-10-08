import { useNavigate } from 'react-router-dom-v5-compat';

import {
  Action,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionModelRef } from '@utils/models';
import { NetworkAttachmentDefinitionModel } from '@utils/models';
import { isUserDefinedNetworkNAD } from '@utils/resources/nads/helpers';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';

type NADsActionsProps = (obj: NetworkAttachmentDefinitionKind) => [actions: Action[]];

const useNADsActions: NADsActionsProps = (obj) => {
  const { t } = useNetworkingTranslation();

  const isUDNManaged = isUserDefinedNetworkNAD(obj);
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj);
  const launchLabelsModal = useLabelsModal(obj);
  const launchAnnotationsModal = useAnnotationsModal(obj);

  const objNamespace = getNamespace(obj);
  const objName = getName(obj);

  const actions = [
    {
      accessReview: asAccessReview(NetworkAttachmentDefinitionModel, obj, 'update'),
      cta: launchLabelsModal,
      description: isUDNManaged && t('Managed by UserDefinedNetwork'),
      disabled: isUDNManaged,
      id: 'edit-labels-nad',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(NetworkAttachmentDefinitionModel, obj, 'update'),
      cta: launchAnnotationsModal,
      description: isUDNManaged && t('Managed by UserDefinedNetwork'),
      disabled: isUDNManaged,
      id: 'edit-annotations-nad',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(NetworkAttachmentDefinitionModel, obj, 'update'),
      cta: () =>
        navigate(`/k8s/ns/${objNamespace}/${NetworkAttachmentDefinitionModelRef}/${objName}/yaml`),
      description: isUDNManaged && t('Managed by UserDefinedNetwork'),
      disabled: isUDNManaged,
      id: 'edit-nad',
      label: t('Edit NetworkAttachmentDefinition'),
    },
    {
      accessReview: asAccessReview(NetworkAttachmentDefinitionModel, obj, 'delete'),
      cta: launchDeleteModal,
      description: isUDNManaged && t('Managed by UserDefinedNetwork'),
      disabled: isUDNManaged,
      id: 'delete-nad',
      label: t('Delete NetworkAttachmentDefinition'),
    },
  ];

  return [actions];
};

export default useNADsActions;
