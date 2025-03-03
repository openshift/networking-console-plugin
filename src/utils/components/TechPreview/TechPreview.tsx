import React, { FC } from 'react';
import classNames from 'classnames';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import './TechPreview.scss';
const TechPreview: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <div className={classNames('pf-v6-c-button', 'TechPreviewLabel')}>{t('Tech preview')}</div>
  );
};

export default TechPreview;
