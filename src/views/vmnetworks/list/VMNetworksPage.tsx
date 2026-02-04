import React, { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { ListPageCreateButton, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Stack, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';

import { VM_NETWORKS_PATH } from '../constants';

import { NADS_LIST_PATH, PATH_BY_TAB_INDEX, TAB_INDEX_BY_PATH, TAB_INDEXES } from './constants';
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
          title={
            <>
              <TabTitleText className="pf-v6-u-mr-sm">{t('Other VM network types')}</TabTitleText>
              <PopoverHelpIcon
                bodyContent={
                  <Stack hasGutter>
                    <p>
                      {t(
                        'This list only shows network definitions that are compatible with virtual machines. To view the complete list of all available networks, refer to the full NetworkAttachmentDefinition list.',
                      )}
                    </p>
                    <Button
                      isInline
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(NADS_LIST_PATH);
                      }}
                      variant="link"
                    >
                      {NetworkAttachmentDefinitionModel.kind}
                    </Button>
                  </Stack>
                }
                headerContent={t('Only VM-compatible networks displayed')}
              />
            </>
          }
        >
          <VMNetworkOtherTypesList />
        </Tab>
      </Tabs>
    </>
  );
};

export default VMNetworksPage;
