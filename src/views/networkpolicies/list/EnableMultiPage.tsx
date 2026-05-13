import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { modelToGroupVersionKind, modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import {
  k8sPatch,
  K8sResourceCommon,
  K8sVerb,
  useAccessReview,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
  EmptyStateHeader,
  Tooltip,
} from '@patternfly/react-core';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { MultiNetworkPolicyModel } from '@utils/models';
import { NetworkConfigModel } from '@views/nads/form/utils/constants';

import '@styles/list-management-group.scss';

const EnableMultiPage: FC = () => {
  const { t } = useNetworkingTranslation();
  const lastNamespacePath = useLastNamespacePath();
  const navigate = useNavigate();

  const [networkClusterConfig, loaded] = useK8sWatchResource<{ spec: any } & K8sResourceCommon>({
    groupVersionKind: modelToGroupVersionKind(NetworkConfigModel),
    name: 'cluster',
  });

  const [canPatchConfig] = useAccessReview({
    group: NetworkConfigModel.apiGroup,
    resource: NetworkConfigModel.plural,
    verb: 'patch' as K8sVerb,
  });

  const enableMultiNetworkPolicy = () => {
    k8sPatch({
      data: [
        {
          op: 'replace',
          path: '/spec/disableMultiNetwork',
          value: false,
        },
        {
          op: 'replace',
          path: '/spec/useMultiNetworkPolicy',
          value: true,
        },
      ],
      model: NetworkConfigModel,
      resource: networkClusterConfig,
    }).then(() => {
      navigate(`/k8s/${lastNamespacePath}/${modelToRef(MultiNetworkPolicyModel)}`);
    });
  };

  const EnableButton = (
    <Button isDisabled={!loaded || !canPatchConfig} onClick={enableMultiNetworkPolicy}>
      {t('Enable {{kind}}', { kind: MultiNetworkPolicyModel.labelPlural })}
    </Button>
  );

  return (
    <EmptyState>
      <EmptyStateHeader
        headingLevel="h4"
        titleText={t('{{kind}} disabled', { kind: MultiNetworkPolicyModel.labelPlural })}
      />
      <EmptyStateFooter>
        <EmptyStateActions>
          {canPatchConfig ? (
            EnableButton
          ) : (
            <Tooltip
              content={t('Cluster administrator permissions are required to enable this feature.')}
            >
              <span>{EnableButton}</span>
            </Tooltip>
          )}
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default EnableMultiPage;
