import { useNavigate } from 'react-router-dom-v5-compat';

import {
  Action,
  useActiveNamespace,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { asAccessReview, getResourceURL } from '@utils/resources/shared';
import { getModel } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

type UDNActionsProps = (
  obj: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind,
) => [actions: Action[]];

const useUDNActions: UDNActionsProps = (obj) => {
  const { t } = useNetworkingTranslation();
  const model = getModel(obj);
  const [activeNamespace] = useActiveNamespace();
  const navigate = useNavigate();
  const launchLabelsModal = useLabelsModal(obj);
  const launchDeleteModal = useDeleteModal(obj);
  const launchAnnotationsModal = useAnnotationsModal(obj);

  const actions = [
    {
      accessReview: asAccessReview(model, obj, 'update'),
      cta: launchLabelsModal,
      id: 'edit-labels-udn',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(model, obj, 'update'),
      cta: launchAnnotationsModal,
      id: 'edit-annotations-udn',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(model, obj, 'update'),
      cta: () =>
        navigate(
          getResourceURL({
            activeNamespace,
            model: model,
            path: 'yaml',
            resource: obj,
          }),
        ),
      id: 'edit-udn',
      label: t('Edit {{kind}}', { kind: model.kind }),
    },
    {
      accessReview: asAccessReview(model, obj, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-annotations-udn',
      label: t('Delete {{kind}}', { kind: model.kind }),
    },
  ];

  return [actions];
};

export default useUDNActions;
