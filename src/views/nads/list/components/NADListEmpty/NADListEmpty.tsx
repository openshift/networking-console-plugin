import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console/modelUtils';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { QuickStart } from '@patternfly/quickstarts';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { RocketIcon } from '@patternfly/react-icons/dist/esm/icons/rocket-icon';
import { DEFAULT_NAMESPACE } from '@utils/constants';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { QuickStartModel } from '@utils/models';
import { resourcePathFromModel } from '@utils/resources/shared';

type NADListEmptyProps = {
  namespace: string;
};

const NADListEmpty: FC<NADListEmptyProps> = ({ namespace }) => {
  const navigate = useNavigate();
  const { t } = useNetworkingTranslation();

  const searchText = 'network attachment definition';
  const [quickStarts, quickStartsLoaded] = useK8sWatchResource<QuickStart[]>({
    groupVersionKind: modelToGroupVersionKind(QuickStartModel),
    isList: true,
  });
  const hasQuickStarts =
    quickStartsLoaded &&
    quickStarts.find(
      ({ spec: { description, displayName } }) =>
        displayName.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText),
    );

  return (
    <EmptyState headingLevel="h4" titleText={t('No NetworkAttachmentDefinition found')}>
      <EmptyStateFooter>
        <Button
          onClick={() =>
            navigate(
              `${resourcePathFromModel(NetworkAttachmentDefinitionModel, null, namespace || DEFAULT_NAMESPACE)}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`,
            )
          }
        >
          {t('Create NetworkAttachmentDefinition')}
        </Button>

        {hasQuickStarts && (
          <EmptyStateActions>
            <Button
              data-test-id="nad-quickstart"
              icon={<RocketIcon />}
              onClick={() => navigate('/quickstart?keyword=network+attachment+definition')}
              variant={ButtonVariant.secondary}
            >
              {t('Learn how to use NetworkAttachmentDefinitions')}
            </Button>
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default NADListEmpty;
