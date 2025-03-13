import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const MaskedData: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <>
      <span className="pf-v6-u-screen-reader">{t('Value hidden')}</span>
      <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
    </>
  );
};

export default MaskedData;
