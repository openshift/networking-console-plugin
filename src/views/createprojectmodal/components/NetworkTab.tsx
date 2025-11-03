import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Alert,
  AlertVariant,
  Content,
  DropdownItem,
  FormGroup,
  TextInput,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import Select from '@utils/components/Select/Select';
import { useIsAdmin } from '@utils/hooks/useIsAdmin';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { networkTypeLabels } from '../constants';
import { CreateProjectModalFormState, NETWORK_TYPE } from '../types';

import SelectClusterUDN from './SelectClusterUDN';

const NetworkTab: FC = () => {
  const { t } = useNetworkingTranslation();
  const isAdmin = useIsAdmin();

  const { control, setValue, watch } = useFormContext<CreateProjectModalFormState>();

  const networkType = watch('networkType');

  return (
    <div className="create-project-modal__networktab">
      <Alert
        className="create-project-modal__network-alert"
        isInline
        title={t(
          'Define the network used by VirtualMachines and Pods to communicate in this project',
        )}
        variant={AlertVariant.info}
      >
        <Content component="p">
          {t('This network must be created before you create any workload in this project')}
        </Content>
      </Alert>

      <Controller
        control={control}
        name="networkType"
        render={({ field: { onChange, value } }) => (
          <FormGroup fieldId="network-type" isRequired label={t('Network type')}>
            <Select
              id="network-type"
              selected={value || NETWORK_TYPE.POD_NETWORK}
              toggleContent={networkTypeLabels[value || NETWORK_TYPE.POD_NETWORK]}
            >
              <>
                {Object.entries(networkTypeLabels)
                  .filter(([type]) =>
                    !isAdmin && type === NETWORK_TYPE.CLUSTER_UDN.toString() ? false : true,
                  )
                  .map(([type, label]) => (
                    <DropdownItem key={type} onClick={() => onChange(parseInt(type))} value={type}>
                      {label}
                    </DropdownItem>
                  ))}
              </>
            </Select>
          </FormGroup>
        )}
      />

      {networkType === NETWORK_TYPE.UDN && (
        <>
          <FormGroup fieldId="input-name" isRequired label={t('Subnet CIDR')}>
            <Controller
              control={control}
              name="udn.spec.layer2.subnets"
              render={({ field: { value } }) => (
                <TextInput
                  autoFocus
                  data-test="input-udn-subnet"
                  id="input-udn-subnet"
                  isRequired
                  name="input-udn-subnet"
                  onChange={(_, newValue) =>
                    setValue('udn.spec.layer2.subnets', newValue.split(','), {
                      shouldValidate: true,
                    })
                  }
                  type="text"
                  value={value?.join(',')}
                />
              )}
              rules={{ required: true }}
            />

            <FormGroupHelperText>
              {t(
                'Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.  The format should match standard CIDR notation (for example, "192.168.123.0/24").',
              )}
            </FormGroupHelperText>
          </FormGroup>
        </>
      )}

      {networkType === NETWORK_TYPE.CLUSTER_UDN && (
        <Controller
          control={control}
          name="clusterUDN"
          render={({ field: { onChange, value: selectedClusterUDN } }) => (
            <SelectClusterUDN onChange={onChange} selectedClusterUDN={selectedClusterUDN} />
          )}
          rules={{ required: true }}
        />
      )}
    </div>
  );
};

export default NetworkTab;
