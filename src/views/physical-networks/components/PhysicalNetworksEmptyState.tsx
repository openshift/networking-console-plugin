import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { NODE_NETWORK_CONFIGURATION_WIZARD_PATH } from '../utils/constants';

type PhysicalNetworksEmptyStateProps = {
  nadsUnreadable: boolean;
  showCreateButton: boolean;
};

const PhysicalNetworksEmptyState: FC<PhysicalNetworksEmptyStateProps> = ({
  nadsUnreadable,
  showCreateButton,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  return (
    <EmptyState
      headingLevel="h4"
      icon={PlusCircleIcon}
      titleText={t('No physical networks found')}
      variant={EmptyStateVariant.lg}
    >
      <EmptyStateBody>
        {nadsUnreadable
          ? t(
              'Network attachment definitions could not be loaded, so networks they reference are not listed here.',
            )
          : t(
              'No network attachment definition in this scope references a physical network. Physical networks configured only on cluster nodes by other tools are not listed here.',
            )}
      </EmptyStateBody>
      {showCreateButton && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button onClick={() => navigate(NODE_NETWORK_CONFIGURATION_WIZARD_PATH)}>
              {t('Create network')}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </EmptyState>
  );
};

export default PhysicalNetworksEmptyState;
