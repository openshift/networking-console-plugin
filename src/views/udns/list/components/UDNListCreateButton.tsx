import React, { FC } from 'react';

import {
  K8sVerb,
  ListPageCreateButton,
  ListPageCreateDropdown,
  useAccessReview,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  ClusterUserDefinedNetworkModel,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/models';

import UserDefinedNetworkCreateModal from './UserDefinedNetworkCreateModal';

type UDNListCreateButtonProps = {
  namespace: string;
};

const UDNListCreateButton: FC<UDNListCreateButtonProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const createModal = useModal();

  const [canCreateClusterUDN] = useAccessReview({
    group: ClusterUserDefinedNetworkModel.apiGroup,
    resource: ClusterUserDefinedNetworkModel.plural,
    verb: 'create' as K8sVerb,
  });

  const openCreateModal = (isClusterUDN: boolean) =>
    createModal(UserDefinedNetworkCreateModal, { isClusterUDN });

  if (!canCreateClusterUDN) {
    return (
      <ListPageCreateButton
        className="list-page-create-button-margin"
        createAccessReview={{
          groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
          namespace,
        }}
        onClick={() => openCreateModal(false)}
      >
        {t('Create UserDefinedNetwork')}
      </ListPageCreateButton>
    );
  }

  return (
    <ListPageCreateDropdown
      createAccessReview={{
        groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
        namespace,
      }}
      items={{
        ClusterUserDefinedNetwork: t('ClusterUserDefinedNetwork'),
        UserDefinedNetwork: t('UserDefinedNetwork'),
      }}
      onClick={(item) => openCreateModal(item === 'ClusterUserDefinedNetwork')}
    >
      {t('Create')}
    </ListPageCreateDropdown>
  );
};

export default UDNListCreateButton;
