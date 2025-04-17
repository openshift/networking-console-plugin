import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import FormGroupHelperText from '../FormGroupHelperText/FormGroupHelperText';

const SubnetCIDRHelperText: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <FormGroupHelperText>
      {t(
        'Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.  The format should match standard CIDR notation (for example, "10.128.0.0/16").',
      )}
    </FormGroupHelperText>
  );
};

export default SubnetCIDRHelperText;
