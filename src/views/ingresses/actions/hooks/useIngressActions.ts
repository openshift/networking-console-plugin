import { useNavigate } from 'react-router';

import { IngressModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  Action,
  useActiveNamespace,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { asAccessReview, getResourceURL } from '@utils/resources/shared';

type UseIngressActions = (ingress: IoK8sApiNetworkingV1Ingress) => [actions: Action[]];

const useIngressActions: UseIngressActions = (ingress) => {
  const { t } = useNetworkingTranslation();
  const [activeNamespace] = useActiveNamespace();
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(ingress);
  const launchLabelsModal = useLabelsModal(ingress);
  const launchAnnotationsModal = useAnnotationsModal(ingress);

  const actions = [
    {
      accessReview: asAccessReview(IngressModel, ingress, 'update'),
      cta: launchLabelsModal,
      id: 'edit-labels-ingresses',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(IngressModel, ingress, 'update'),
      cta: launchAnnotationsModal,
      id: 'edit-annotations-ingresses',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(IngressModel, ingress, 'update'),
      cta: () =>
        navigate(
          getResourceURL({ activeNamespace, model: IngressModel, path: 'yaml', resource: ingress }),
        ),
      id: 'edit-ingress',
      label: t('Edit Ingress'),
    },
    {
      accessReview: asAccessReview(IngressModel, ingress, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-ingress',
      label: t('Delete Ingress'),
    },
  ];

  return [actions];
};

export default useIngressActions;
