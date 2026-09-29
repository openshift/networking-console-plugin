import { useNavigate } from 'react-router';

import { modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  Action,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getPolicyModel } from '@utils/resources/networkpolicies/utils';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';

type NetworkPolicyActionProps = (obj: IoK8sApiNetworkingV1NetworkPolicy) => [actions: Action[]];

const useNetworkPolicyActions: NetworkPolicyActionProps = (obj) => {
  const { t } = useNetworkingTranslation();

  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj);
  const launchLabelsModal = useLabelsModal(obj);
  const launchAnnotationsModal = useAnnotationsModal(obj);

  const objNamespace = getNamespace(obj);
  const objName = getName(obj);

  const policyModel = getPolicyModel(obj);

  const actions = [
    {
      accessReview: asAccessReview(policyModel, obj, 'update'),
      cta: launchLabelsModal,
      id: 'edit-labels-network-policies',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(policyModel, obj, 'update'),
      cta: launchAnnotationsModal,
      id: 'edit-annotations-network-policies',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(policyModel, obj, 'update'),
      cta: () => navigate(`/k8s/ns/${objNamespace}/${modelToRef(policyModel)}/${objName}/yaml`),
      id: 'edit-network-policies',
      label: t('Edit {{kind}}', { kind: policyModel.kind }),
    },
    {
      accessReview: asAccessReview(policyModel, obj, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-network-policy',
      label: t('Delete {{kind}}', { kind: policyModel.kind }),
    },
  ];

  return [actions];
};

export default useNetworkPolicyActions;
