import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const ResourcesTab: FC = () => {
  const { t } = useNetworkingTranslation();

  return <div className="pf-v6-u-pt-md">{t('Resources')}</div>;
};

export default ResourcesTab;
