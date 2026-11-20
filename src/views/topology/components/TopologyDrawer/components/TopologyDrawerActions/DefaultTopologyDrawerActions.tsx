import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { PodModel, VirtualMachineModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  Action,
  K8sResourceCommon,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  asAccessReview,
  getName,
  getNamespace,
  resourcePathFromModel,
} from '@utils/resources/shared';
import { ResourceType } from '@views/topology/utils/constants';

type DefaultTopologyDrawerActionsProps = {
  resource: K8sResourceCommon;
  resourceType: ResourceType;
};

const DefaultTopologyDrawerActions: FC<DefaultTopologyDrawerActionsProps> = ({
  resource,
  resourceType,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(resource);
  const launchLabelsModal = useLabelsModal(resource);
  const launchAnnotationsModal = useAnnotationsModal(resource);
  const model = resourceType === ResourceType.VirtualMachine ? VirtualMachineModel : PodModel;

  const resourcePath = resourcePathFromModel(model, getName(resource), getNamespace(resource));

  const actions = useMemo<Action[]>(
    () => [
      {
        accessReview: asAccessReview(model, resource, 'get'),
        cta: () => navigate(resourcePath),
        id: 'open-details',
        label: t('Open details'),
      },
      ...(resourceType === ResourceType.Pod
        ? [
            {
              accessReview: asAccessReview(model, resource, 'get'),
              cta: () => navigate(`${resourcePath}/logs`),
              id: 'view-logs',
              label: t('View logs'),
            },
          ]
        : []),
      {
        accessReview: asAccessReview(model, resource, 'update'),
        cta: launchLabelsModal,
        id: 'edit-labels',
        label: t('Edit labels'),
      },
      {
        accessReview: asAccessReview(model, resource, 'update'),
        cta: launchAnnotationsModal,
        id: 'edit-annotations',
        label: t('Edit annotations'),
      },
      {
        accessReview: asAccessReview(model, resource, 'update'),
        cta: () => navigate(`${resourcePath}/yaml`),
        id: 'edit-yaml',
        label: t('Edit YAML'),
      },
      {
        accessReview: asAccessReview(model, resource, 'delete'),
        cta: launchDeleteModal,
        id: 'delete',
        label: t('Delete'),
      },
    ],
    [
      launchAnnotationsModal,
      launchDeleteModal,
      launchLabelsModal,
      navigate,
      model,
      resource,
      resourcePath,
      resourceType,
      t,
    ],
  );

  return <ActionsDropdown actions={actions} id="topology-drawer-actions" />;
};

export default DefaultTopologyDrawerActions;
