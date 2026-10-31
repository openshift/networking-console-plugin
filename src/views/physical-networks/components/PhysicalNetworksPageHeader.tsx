import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { Button, Flex, Title } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { NODE_NETWORK_CONFIGURATION_WIZARD_PATH } from '../utils/constants';

type PhysicalNetworksPageHeaderProps = {
  showCreateButton: boolean;
};

const PhysicalNetworksPageHeader: FC<PhysicalNetworksPageHeaderProps> = ({ showCreateButton }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  return (
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      className="pf-v6-u-mb-xl"
      justifyContent={{ default: 'justifyContentSpaceBetween' }}
    >
      <Title data-test-id="resource-title" headingLevel="h1">
        {t('Physical networks')}
      </Title>
      {showCreateButton && (
        <Button onClick={() => navigate(NODE_NETWORK_CONFIGURATION_WIZARD_PATH)} variant="primary">
          {t('Create network')}
        </Button>
      )}
    </Flex>
  );
};

export default PhysicalNetworksPageHeader;
