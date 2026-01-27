import React, { FC, useEffect } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

import { Alert, AlertVariant, Label } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { UDN_NO_NAMESPACE_ALERT_SHOWN } from '@utils/telemetry/constants';
import { logNetworkingEvent } from '@utils/telemetry/telemetry';
import { PRIMARY_USER_DEFINED_LABEL } from '@views/udns/list/constants';

type NoProjectReadyForPrimaryUDNAlertProps = {
  className?: string;
};

const NoProjectReadyForPrimaryUDNAlert: FC<NoProjectReadyForPrimaryUDNAlertProps> = ({
  className,
}) => {
  const { t } = useNetworkingTranslation();

  useEffect(() => {
    logNetworkingEvent(UDN_NO_NAMESPACE_ALERT_SHOWN);
  }, []);

  return (
    <Alert
      className={className}
      isInline
      title={t('No namespace is configured for a primary user-defined network')}
      variant={AlertVariant.danger}
    >
      <Trans t={t}>
        At creation time the namespace must be configured with{' '}
        <Label>{{ label: PRIMARY_USER_DEFINED_LABEL }}</Label> label. Go to{' '}
        <Link target="_blank" to={`/k8s/cluster/namespaces`}>
          Namespaces
        </Link>{' '}
        to create a new namespace.
      </Trans>
    </Alert>
  );
};

export default NoProjectReadyForPrimaryUDNAlert;
