import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { Alert, AlertActionLink } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { CREATE_PHYSICAL_NETWORK_FORM_PATH } from '@views/vmnetworks/constants';

import './NoPhysicalNetworkAlert.scss';

const NoPhysicalNetworkAlert: FC = () => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  return (
    <Alert
      actionLinks={
        <AlertActionLink onClick={() => navigate(CREATE_PHYSICAL_NETWORK_FORM_PATH)}>
          {t('Create physical network')}
        </AlertActionLink>
      }
      isInline
      title={t('To create an OVN localnet network, you must first define a physical network.')}
      variant="warning"
    />
  );
};

export default NoPhysicalNetworkAlert;
