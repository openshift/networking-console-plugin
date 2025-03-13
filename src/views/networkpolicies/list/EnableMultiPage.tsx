import React, { FC, useState } from 'react';
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
  Alert,
  AlertVariant,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Tooltip,
} from '@patternfly/react-core';
import { ALL_NAMESPACES } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { MultiNetworkPolicyModel } from '@utils/models';
import { NetworkConfigModel } from '@views/nads/form/utils/constants';

import '@styles/list-management-group.scss';

type EnableMultiPageProps = { namespace: string };

const EnableMultiPage: FC<EnableMultiPageProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<Error | null>();

  const [networkClusterConfig, loaded] = useK8sWatchResource<K8sResourceCommon & { spec: any }>({
    groupVersionKind: modelToGroupVersionKind(NetworkConfigModel),
    name: 'cluster',
  });

  const [canPatchConfig] = useAccessReview({
    group: NetworkConfigModel.apiGroup,
    resource: NetworkConfigModel.plural,
    verb: 'patch' as K8sVerb,
  });

  const enableMultiNetworkPolicy = async () => {
    setError(null);
    try {
      await k8sPatch({
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
      });
      navigate(`/k8s/${namespace || ALL_NAMESPACES}/${modelToRef(MultiNetworkPolicyModel)}`);
    } catch (apiError) {
      setError(apiError);
    }
  };

  const EnableButton = (
    <Button isDisabled={!loaded || !canPatchConfig} onClick={enableMultiNetworkPolicy}>
      {t('Enable {{kind}}', { kind: MultiNetworkPolicyModel.labelPlural })}
    </Button>
  );

  return (
    <EmptyState
      headingLevel="h4"
      titleText={t('{{kind}} disabled', { kind: MultiNetworkPolicyModel.labelPlural })}
    >
      {error && (
        <EmptyStateBody>
          <Alert title={t('Error')} variant={AlertVariant.danger}>
            {error.message}
          </Alert>
        </EmptyStateBody>
      )}
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
