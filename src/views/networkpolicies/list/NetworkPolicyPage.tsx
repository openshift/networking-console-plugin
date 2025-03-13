import React, { FC, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import { modelToGroupVersionKind, NetworkPolicyModel } from '@kubevirt-ui/kubevirt-api/console';
import { ListPageCreateButton, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { ALL_NAMESPACES, DEFAULT_NAMESPACE } from '@utils/constants';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { MultiNetworkPolicyModel } from '@utils/models';
import { resourcePathFromModel } from '@utils/resources/shared';

import useIsMultiEnabled from './hooks/useIsMultiEnabled';
import { TAB_INDEXES } from './constants';
import EnableMultiPage from './EnableMultiPage';
import MultiNetworkPolicyList from './MultiNetworkPolicyList';
import NetworkPolicyList from './NetworkPolicyList';
import { getActiveKeyFromPathname, getNetworkPolicyURLTab } from './utils';

export type NetworkPolicyPageNavProps = {
  namespace: string;
};

const NetworkPolicyPage: FC<NetworkPolicyPageNavProps> = ({ namespace }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const locationTabKey = useMemo(
    () => getActiveKeyFromPathname(location?.pathname),
    [location?.pathname],
  );
  const [isMultiEnabled] = useIsMultiEnabled();
  const { t } = useNetworkingTranslation();

  const selectedModel =
    locationTabKey === TAB_INDEXES.NETWORK ? NetworkPolicyModel : MultiNetworkPolicyModel;

  return (
    <>
      <ListPageHeader title={t(selectedModel.labelPlural)}>
        {locationTabKey !== TAB_INDEXES.ENABLE_MULTI && (
          <ListPageCreateButton
            className="list-page-create-button-margin"
            createAccessReview={{
              groupVersionKind: modelToGroupVersionKind(selectedModel),
              namespace,
            }}
            onClick={() =>
              navigate(
                `${resourcePathFromModel(
                  selectedModel,
                  null,
                  namespace || DEFAULT_NAMESPACE,
                )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`,
              )
            }
          >
            {t('Create {{kind}}', { kind: selectedModel.kind })}
          </ListPageCreateButton>
        )}
      </ListPageHeader>
      <Tabs
        activeKey={locationTabKey}
        onSelect={(_, tabIndex: number | string) => {
          navigate(getNetworkPolicyURLTab(tabIndex, namespace || ALL_NAMESPACES));
        }}
        unmountOnExit
      >
        <Tab
          eventKey={TAB_INDEXES.NETWORK}
          title={<TabTitleText>{t('NetworkPolicies')}</TabTitleText>}
        >
          <NetworkPolicyList namespace={namespace} />
        </Tab>
        {isMultiEnabled ? (
          <Tab
            eventKey={TAB_INDEXES.MULTI_NETWORK}
            title={<TabTitleText>{t('MultiNetworkPolicies')}</TabTitleText>}
          >
            <MultiNetworkPolicyList namespace={namespace} />
          </Tab>
        ) : (
          <Tab
            eventKey={TAB_INDEXES.ENABLE_MULTI}
            title={<TabTitleText>{t('MultiNetworkPolicies')}</TabTitleText>}
          >
            <EnableMultiPage namespace={namespace} />
          </Tab>
        )}
      </Tabs>
    </>
  );
};

export default NetworkPolicyPage;
