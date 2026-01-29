import React, { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import { ListPageCreateButton, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';

import { VM_NETWORKS_PATH } from '../constants';

import { PATH_BY_TAB_INDEX, TAB_INDEX_BY_PATH, TAB_INDEXES } from './constants';
import VMNetworkList from './VMNetworkList';
import VMNetworkOtherTypesList from './VMNetworkOtherTypesList';

const VMNetworksPage: FC = () => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const locationTabKey = TAB_INDEX_BY_PATH[location?.pathname];

  const onCreate = () => {
    navigate(`${VM_NETWORKS_PATH}/~new`);
  };

  return (
    <>
      <ListPageHeader title={t('Virtual machine networks')}>
        <ListPageCreateButton
          createAccessReview={{
            groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
          }}
          onClick={onCreate}
        >
          {t('Create network')}
        </ListPageCreateButton>
      </ListPageHeader>
      <Tabs
        activeKey={locationTabKey}
        onSelect={(_, tabIndex: number | string) => navigate(PATH_BY_TAB_INDEX[tabIndex])}
        unmountOnExit
      >
        <Tab
          eventKey={TAB_INDEXES.OVN_LOCALNET}
          title={<TabTitleText>{t('OVN localnet')}</TabTitleText>}
        >
          <VMNetworkList onCreate={onCreate} />
        </Tab>
        <Tab
          eventKey={TAB_INDEXES.OTHER_VM_NETWORK_TYPES}
          title={<TabTitleText>{t('Other VM network types')}</TabTitleText>}
        >
          <VMNetworkOtherTypesList />
        </Tab>
      </Tabs>
    </>
  );
};

export default VMNetworksPage;
