import { useNavigate } from 'react-router-dom-v5-compat';

import { modelToRef, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  Action,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import PodSelectorModal, {
  PodSelectorModalProps,
} from '@utils/components/PodSelectorModal/PodSelectorModal';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';

type ServiceActionProps = (obj: IoK8sApiCoreV1Service) => [actions: Action[]];

const useServiceActions: ServiceActionProps = (obj) => {
  const { t } = useNetworkingTranslation();

  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj);
  const launchLabelsModal = useLabelsModal(obj);
  const launchAnnotationsModal = useAnnotationsModal(obj);

  const objNamespace = getNamespace(obj);
  const objName = getName(obj);
  const createModal = useModal();

  const actions = [
    {
      accessReview: asAccessReview(ServiceModel, obj, 'update'),
      cta: () =>
        createModal<PodSelectorModalProps>(PodSelectorModal, {
          model: ServiceModel,
          resource: obj,
        }),
      id: 'edit-pod-selectors-services',
      label: t('Edit Pod selector'),
    },
    {
      accessReview: asAccessReview(ServiceModel, obj, 'update'),
      cta: launchLabelsModal,
      id: 'edit-labels-services',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(ServiceModel, obj, 'update'),
      cta: launchAnnotationsModal,
      id: 'edit-annotations-services',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(ServiceModel, obj, 'update'),
      cta: () => navigate(`/k8s/ns/${objNamespace}/${modelToRef(ServiceModel)}/${objName}/yaml`),
      id: 'edit-services',
      label: t('Edit Service'),
    },
    {
      accessReview: asAccessReview(ServiceModel, obj, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-services',
      label: t('Delete Service'),
    },
  ];

  return [actions];
};

export default useServiceActions;
