import React from 'react';

import { Badge } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import NADDetails from '../tabs/details/NADDetails';
import NADVirtualMachines from '../tabs/virtualMachines/NADVirtualMachines';
import NADYAML from '../tabs/yaml/NADYAML';

export const useNADTabs = (vmCount = 0) => {
  const { t } = useNetworkingTranslation();

  return [
    {
      component: NADDetails,
      href: '',
      name: t('Details'),
    },
    {
      component: NADYAML,
      href: 'yaml',
      name: t('YAML'),
    },
    {
      component: NADVirtualMachines,
      href: 'virtual-machines',
      name: (
        <>
          {t('Virtual Machines')}
          <Badge className="pf-v6-u-ml-sm" isRead>
            {vmCount}
          </Badge>
        </>
      ),
    },
  ];
};
