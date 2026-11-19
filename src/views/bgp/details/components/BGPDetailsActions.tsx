import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { useDeleteModal } from '@openshift-console/dynamic-plugin-sdk';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { BGPCloudConfiguration, BGPRouting } from '@utils/resources/bgp/types';
import { asAccessReview, getName, resourcePathFromModel } from '@utils/resources/shared';

type BGPDetailsActionsProps = {
  model: typeof BGPCloudConfigurationModel;
  obj: BGPCloudConfiguration | BGPRouting;
};

const BGPDetailsActions: FC<BGPDetailsActionsProps> = ({ model, obj }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj, resourcePathFromModel(model));
  const resourcePath = resourcePathFromModel(model, getName(obj));
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

  return <ActionsDropdown actions={actions} id="bgp-resource-actions" isKebabToggle={false} />;
};

export default BGPDetailsActions;
