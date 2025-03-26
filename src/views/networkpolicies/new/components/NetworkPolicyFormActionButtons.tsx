import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type NetworkPolicyFormActionButtonsProps = {
  isDisabled: boolean;
  isLoading: boolean;
};

const NetworkPolicyFormActionButtons: FC<NetworkPolicyFormActionButtonsProps> = ({
  isDisabled,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { t } = useNetworkingTranslation();

  return (
    <ActionGroup className="pf-v6-c-form">
      <Button id="save-changes" isDisabled={isDisabled} isLoading={isLoading} type="submit">
        {t('Create')}
      </Button>
      <Button id="cancel" onClick={() => navigate(-1)} variant={ButtonVariant.secondary}>
        {t('Cancel')}
      </Button>
    </ActionGroup>
  );
};

export default NetworkPolicyFormActionButtons;
