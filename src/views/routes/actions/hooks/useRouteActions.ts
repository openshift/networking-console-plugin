import { useNavigate } from 'react-router-dom-v5-compat';

import { modelToRef, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  Action,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';

type UseRouteActions = (route: RouteKind) => [actions: Action[]];

const useRouteActions: UseRouteActions = (route) => {
  const { t } = useNetworkingTranslation();

  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(route);
  const launchLabelsModal = useLabelsModal(route);
  const launchAnnotationsModal = useAnnotationsModal(route);

  const routeNamespace = getNamespace(route);
  const routeName = getName(route);

  const actions = [
    {
      accessReview: asAccessReview(RouteModel, route, 'update'),
      cta: launchLabelsModal,
      id: 'edit-labels-routes',
      label: t('Edit labels'),
    },
    {
      accessReview: asAccessReview(RouteModel, route, 'update'),
      cta: launchAnnotationsModal,
      id: 'edit-annotations-routes',
      label: t('Edit annotations'),
    },
    {
      accessReview: asAccessReview(RouteModel, route, 'update'),
      cta: () => navigate(`/k8s/ns/${routeNamespace}/${modelToRef(RouteModel)}/${routeName}/form`),
      id: 'edit-routes',
      label: t('Edit Route'),
    },
    {
      accessReview: asAccessReview(RouteModel, route, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-routes',
      label: t('Delete Route'),
    },
  ];

  return [actions];
};

export default useRouteActions;
