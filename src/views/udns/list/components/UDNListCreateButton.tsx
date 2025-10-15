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
  ClusterUserDefinedNetworkModelGroupVersionKind,
  UserDefinedNetworkModel,
  UserDefinedNetworkModelGroupVersionKind,
} from '@utils/models';
import { getNamespace } from '@utils/resources/shared';
import { isPrimaryUDN } from '@utils/resources/udns/helper';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

import UserDefinedNetworkCreateModal from './UserDefinedNetworkCreateModal';

type UDNListCreateButtonProps = {
  allUDNs: Array<ClusterUserDefinedNetworkKind | UserDefinedNetworkKind>;
  namespace: string;
};

const UDNListCreateButton: FC<UDNListCreateButtonProps> = ({ allUDNs, namespace }) => {
  const { t } = useNetworkingTranslation();
  const createModal = useModal();

  const namespaceHavePrimaryUDN = allUDNs?.find(
    (udn) =>
      udn.kind === UserDefinedNetworkModel.kind &&
      getNamespace(udn) === namespace &&
      isPrimaryUDN(udn),
  );

  const [canCreateClusterUDN] = useAccessReview({
    group: ClusterUserDefinedNetworkModel.apiGroup,
    resource: ClusterUserDefinedNetworkModel.plural,
    verb: 'create' as K8sVerb,
  });

  if (!canCreateClusterUDN) {
    return (
      <ListPageCreateButton
        className="list-page-create-button-margin"
        createAccessReview={{
          groupVersionKind: UserDefinedNetworkModelGroupVersionKind,
          namespace,
        }}
        onClick={() =>
          createModal(UserDefinedNetworkCreateModal, {
            isClusterUDN: false,
          })
        }
      >
        {t('Create UserDefinedNetwork')}
      </ListPageCreateButton>
    );
  }

  if (namespaceHavePrimaryUDN) {
    return (
      <ListPageCreateButton
        className="list-page-create-button-margin"
        createAccessReview={{
          groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
          namespace,
        }}
        onClick={() =>
          createModal(UserDefinedNetworkCreateModal, {
            isClusterUDN: true,
          })
        }
      >
        {t('Create ClusterUserDefinedNetwork')}
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
      onClick={(item) =>
        createModal(UserDefinedNetworkCreateModal, {
          isClusterUDN: item === 'ClusterUserDefinedNetwork',
        })
      }
    >
      {t('Create')}
    </ListPageCreateDropdown>
  );
};

export default UDNListCreateButton;
