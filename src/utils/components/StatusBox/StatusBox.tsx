import React, { FC, ReactNode } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import ErrorPage from '../ErrorPage/ErrorPage';
import Loading from '../Loading/Loading';

type StatusBoxProps = {
  children?: ReactNode;
  error: any;
  loaded: boolean;
};

const StatusBox: FC<StatusBoxProps> = ({ children, error, loaded }) => {
  const { t } = useNetworkingTranslation();

  if (error) {
    return (
      <ErrorPage
        message={error?.message}
        title={error?.code === 404 ? t('404: Page Not Found') : null}
      />
    );
  }

  if (!loaded) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default StatusBox;
