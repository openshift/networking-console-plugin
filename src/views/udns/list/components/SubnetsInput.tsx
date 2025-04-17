import React, { FC } from 'react';
import { FieldPath, useFormContext, useWatch } from 'react-hook-form';

import { FormGroup, TextInput } from '@patternfly/react-core';
import SubnetCIDRHelperText from '@utils/components/SubnetCIDRHelperText/SubnetCIDRHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  UserDefinedNetworkLayer3Subnet,
  UserDefinedNetworkSpec,
} from '@utils/resources/udns/types';

import { UDNForm } from './constants';
import { getSubnetFields, getSubnetsFromNetworkSpec } from './utils';

type SubnetsInputProps = {
  isClusterUDN?: boolean;
};

const SubnetsInput: FC<SubnetsInputProps> = ({ isClusterUDN }) => {
  const { t } = useNetworkingTranslation();

  const { setValue } = useFormContext<UDNForm>();
  const networkSpecPath = isClusterUDN ? 'spec.network' : 'spec';

  const networkSpec: UserDefinedNetworkSpec = useWatch<UDNForm>({
    name: networkSpecPath,
  });

  const subnets = getSubnetsFromNetworkSpec(networkSpec);

  const subnetsText = networkSpec.layer3
    ? (subnets as UserDefinedNetworkLayer3Subnet[]).map((subnet) => subnet.cidr).join(',')
    : subnets?.join(',');

  return (
    <FormGroup fieldId="input-udn-subnet" isRequired label={t('Subnet CIDR')}>
      <TextInput
        autoFocus
        data-test="input-udn-subnet"
        id="input-udn-subnet"
        isRequired
        name="input-udn-subnet"
        onChange={(_, newValue) => {
          const subnetField = getSubnetFields(networkSpec, isClusterUDN);

          const newSubnet = networkSpec.layer3
            ? newValue.split(',').map((subnet) => ({ cidr: subnet }))
            : newValue.split(',');

          setValue(subnetField as FieldPath<UDNForm>, newSubnet, {
            shouldValidate: true,
          });
        }}
        type="text"
        value={subnetsText}
      />
      <SubnetCIDRHelperText />
    </FormGroup>
  );
};

export default SubnetsInput;
