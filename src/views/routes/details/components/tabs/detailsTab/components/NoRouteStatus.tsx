import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const NoRouteStatus: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <div className="cos-status-box">
      <div className="pf-v6-u-text-align-center">{t('No route status')}</div>
    </div>
  );
};

export default NoRouteStatus;
