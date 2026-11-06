import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import type { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { useDeleteModal } from '@openshift-console/dynamic-plugin-sdk';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfiguration, BGPRouting } from '@utils/resources/bgp';
import { asAccessReview, resourcePathFromModel } from '@utils/resources/shared';

type BGPListActionsProps = {
  model: K8sModel;
  obj: BGPCloudConfiguration | BGPRouting;
};

const BGPListActions: FC<BGPListActionsProps> = ({ model, obj }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj);
  const resourcePath = resourcePathFromModel(model, obj.metadata?.name);
  const actions = [
    {
      accessReview: asAccessReview(model, obj, 'update'),
      cta: () => navigate(`${resourcePath}/form`),
      id: 'edit-bgp-resource',
      label: t('Edit {{kind}}', { kind: model.kind }),
    },
    {
      accessReview: asAccessReview(model, obj, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-bgp-resource',
      label: t('Delete {{kind}}', { kind: model.kind }),
    },
  ];

  return <ActionsDropdown actions={actions} id="bgp-list-actions" isKebabToggle />;
};

export default BGPListActions;
