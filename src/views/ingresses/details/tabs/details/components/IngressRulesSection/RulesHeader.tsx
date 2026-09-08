import React, { FC } from 'react';

import { Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const RulesHeader: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <Thead>
      <Tr>
        <Th>{t('Host')}</Th>
        <Th>{t('Path')}</Th>
        <Th visibility={['hidden', 'visibleOnMd']}>{t('Path type')}</Th>
        <Th visibility={['hidden', 'visibleOnSm']}>{t('Service')}</Th>
        <Th visibility={['hidden', 'visibleOnMd']}>{t('Service port')}</Th>
      </Tr>
    </Thead>
  );
};

export default RulesHeader;
