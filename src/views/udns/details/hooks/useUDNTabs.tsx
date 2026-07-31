import React from 'react';

import { Badge } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import UDNDetailsTab from '../tabs/details/UDNDetailsTab';
import UDNVirtualMachines from '../tabs/virtualMachines/UDNVirtualMachines';
import UserDefinedNetworkYAML from '../tabs/yaml/UserDefinedNetworkYAML';

export const useUDNTabs = (vmCount = 0) => {
  const { t } = useNetworkingTranslation();

  return [
    {
      component: UDNDetailsTab,
      href: '',
      name: t('Details'),
    },
    {
      component: UserDefinedNetworkYAML,
      href: 'yaml',
      name: t('YAML'),
    },
    {
      component: UDNVirtualMachines,
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
