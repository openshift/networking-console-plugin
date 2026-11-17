import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';

import {
  Action,
  getGroupVersionKindForResource,
  K8sResourceCommon,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';

type DefaultTopologyDrawerActionsProps = {
  resource: K8sResourceCommon;
};

const DefaultTopologyDrawerActions: FC<DefaultTopologyDrawerActionsProps> = ({ resource }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(resource);

  const resourcePath = useMemo(() => {
    const { group, kind, version } = getGroupVersionKindForResource(resource);
    const reference = `${group || 'core'}~${version}~${kind}`;
    const namespace = getNamespace(resource);
    const scope = namespace ? `ns/${namespace}` : 'cluster';
    return `/k8s/${scope}/${reference}/${getName(resource)}`;
  }, [resource]);

  const actions = useMemo<Action[]>(
    () => [
      {
        cta: () => navigate(resourcePath),
        id: 'open-details',
        label: t('Open details'),
      },
      {
        cta: () => navigate(`${resourcePath}/yaml`),
        id: 'edit-yaml',
        label: t('Edit YAML'),
      },
      { cta: launchDeleteModal, id: 'delete', label: t('Delete') },
    ],
    [launchDeleteModal, navigate, resourcePath, t],
  );

  return <ActionsDropdown actions={actions} id="topology-drawer-actions" />;
};

export default DefaultTopologyDrawerActions;
