import React, { FC } from 'react';
import { Link } from 'react-router';

import { Alert, AlertVariant, Stack, StackItem } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

type ErrorAlertProps = {
  error: any | Error;
};

const ErrorAlert: FC<ErrorAlertProps> = ({ error }) => {
  const { t } = useNetworkingTranslation();

  if (isEmpty(error)) return null;

  return (
    <Alert isInline title={t('An error occurred.')} variant={AlertVariant.danger}>
      <Stack hasGutter>
        <StackItem>{error?.message}</StackItem>
        {error?.href && (
          <StackItem>
            <Link rel="noreferrer" target="_blank" to={error.href}>
              {error.href}
            </Link>
          </StackItem>
        )}
      </Stack>
    </Alert>
  );
};

export default ErrorAlert;
