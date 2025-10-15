import React, { FC } from 'react';

import {
  ListPageCreateButton,
  ListPageCreateDropdown,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { useIsAdmin } from '@utils/hooks/useIsAdmin';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
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
  const isAdmin = useIsAdmin();

  const namespaceHavePrimaryUDN = allUDNs?.find(
    (udn) =>
      udn.kind === UserDefinedNetworkModel.kind &&
      getNamespace(udn) === namespace &&
      isPrimaryUDN(udn),
  );

  if (!isAdmin) {
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
