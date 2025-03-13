import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type EmptyBoxProps = {
  label: string;
};

const EmptyBox: FC<EmptyBoxProps> = ({ label }) => {
  const { t } = useNetworkingTranslation();

  return (
    <div className="cos-status-box">
      <div className="pf-v6-u-text-align-center" data-test="empty-message">
        {label ? t('No {{label}} found', { label }) : t('Not found')}
      </div>
    </div>
  );
};

export default EmptyBox;
