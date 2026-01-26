import React, { FC } from 'react';
import { Trans } from 'react-i18next';

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';
import usePhysicalNetworkOptions from '@views/vmnetworks/hooks/usePhysicalNetworkOptions';

import NoPhysicalNetworkAlert from './NoPhysicalNetworkAlert';

type LocalnetEmptyStateProps = {
  onCreate: () => void;
};

const LocalnetEmptyState: FC<LocalnetEmptyStateProps> = ({ onCreate }) => {
  const { t } = useNetworkingTranslation();

  const kind = t('OVN localnet network');
  const createButtonText = t('Create network');

  const [physicalNetworkOptions] = usePhysicalNetworkOptions();

  const canCreate = !isEmpty(physicalNetworkOptions);

  return (
    <EmptyState
      headingLevel="h4"
      icon={AddCircleOIcon}
      titleText={t('No {{kind}} found', { kind })}
    >
      <EmptyStateBody>
        {canCreate ? (
          <Trans t={t}>
            Click <b>{{ createButtonText }}</b> to create your first {{ kind }}
          </Trans>
        ) : (
          <NoPhysicalNetworkAlert />
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button isDisabled={!canCreate} onClick={onCreate}>
            {createButtonText}
          </Button>
        </EmptyStateActions>
        <EmptyStateActions>
          <ExternalLink href={getDocumentationURL(documentationURLs.vmNetworking)}>
            {t('Learn more about {{ kind }}', { kind })}
          </ExternalLink>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default LocalnetEmptyState;
