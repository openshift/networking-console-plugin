import { useNavigate } from 'react-router';

import type { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import {
  Action,
  useActiveNamespace,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { IngressModel } from '@utils/models';
import { asAccessReview, resourcePathFromModel } from '@utils/resources/shared';
import { getValidNamespace } from '@utils/utils';

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
          // Use the canonical group~version~kind path: the console does not
          // resolve the short "ingresses" plural, so Edit Ingress would 404.
          `${resourcePathFromModel(
            IngressModel,
            ingress?.metadata?.name,
            ingress?.metadata?.namespace || getValidNamespace(activeNamespace),
          )}/yaml`,
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
