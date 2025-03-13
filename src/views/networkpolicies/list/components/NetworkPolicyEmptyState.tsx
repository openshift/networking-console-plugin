import React, { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import { NetworkPolicyModel } from '@kubevirt-ui/kubevirt-api/console';
import { Button, EmptyState, EmptyStateActions, EmptyStateFooter } from '@patternfly/react-core';
import { DEFAULT_NAMESPACE } from '@utils/constants';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { MultiNetworkPolicyModel } from '@utils/models';
import { resourcePathFromModel } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

const NetworkPolicyEmptyState: FC = () => {
  const { t } = useNetworkingTranslation();
  const lastNamespacePath = useLastNamespacePath();
  const location = useLocation();

  const networkModel = isEmpty(location.pathname.match(MultiNetworkPolicyModel.kind))
    ? NetworkPolicyModel
    : MultiNetworkPolicyModel;

  const navigate = useNavigate();

  return (
    <EmptyState headingLevel="h4" titleText={t('No {{kind}} found', { kind: networkModel.kind })}>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button
            onClick={() =>
              navigate(
                `${resourcePathFromModel(
                  NetworkPolicyModel,
                  null,
                  lastNamespacePath || DEFAULT_NAMESPACE,
                )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`,
              )
            }
          >
            {t('Create {{kind}}', { kind: networkModel.kind })}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default NetworkPolicyEmptyState;
