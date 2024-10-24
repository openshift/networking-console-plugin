import { useNavigate } from 'react-router-dom-v5-compat';

import {
  Action,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';
import { UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { UserDefinedNetworkModel, UserDefinedNetworkModelRef } from '@utils/resources/udns/utils';

type UDNActionsProps = (obj: UserDefinedNetworkKind) => [actions: Action[]];

const useUDNActions: UDNActionsProps = (obj) => {
  const { t } = useNetworkingTranslation();

  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj);
  const launchLabelsModal = useLabelsModal(obj);
  const launchAnnotationsModal = useAnnotationsModal(obj);

  const objNamespace = getNamespace(obj);
  const objName = getName(obj);

  const actions = [
    {
      accessReview: asAccessReview(UserDefinedNetworkModel, obj, 'update'),
      cta: launchLabelsModal,
      id: 'edit-labels-udn',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(UserDefinedNetworkModel, obj, 'update'),
      cta: launchAnnotationsModal,
      id: 'edit-annotations-udn',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(UserDefinedNetworkModel, obj, 'update'),
      cta: () => navigate(`/k8s/ns/${objNamespace}/${UserDefinedNetworkModelRef}/${objName}/yaml`),
      id: 'edit-udn',
      label: t('EditUserDefinedNetwork'),
    },
    {
      accessReview: asAccessReview(UserDefinedNetworkModel, obj, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-udn',
      label: t('DeleteUserDefinedNetwork'),
    },
  ];

  return [actions];
};

export default useUDNActions;
