import React, { FC, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Alert,
  Checkbox,
  Form,
  FormGroup,
  Split,
  SplitItem,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import SelectTypeahead from '@utils/components/SelectTypeahead/SelectTypeahead';
import { MAX_MTU } from '@utils/constants/mtu';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { VLAN_MODE_ACCESS } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import usePhysicalNetworkOptions from '../../hooks/usePhysicalNetworkOptions';
import { DEFAULT_MTU, VMNetworkForm } from '../constants';
import useMaxMTU from '../hooks/useMaxMTU';
import { getMTUValidatedInfo } from '../utils/utils';

import VLANIDField from './VLANIDField';

import './NetworkDefinition.scss';

const NetworkDefinition: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control, register, setValue, watch } = useFormContext<VMNetworkForm>();

  const localnet = watch('network.spec.network.localnet.physicalNetworkName');
  const mtu = watch('network.spec.network.localnet.mtu');

  const [physicalNetworkOptions, nncpSpecListForLocalnet] = usePhysicalNetworkOptions();
  const maxMTUFromLocalnet = useMaxMTU(localnet, nncpSpecListForLocalnet);

  useEffect(() => {
    if (mtu === null) {
      setValue(
        'network.spec.network.localnet.mtu',
        maxMTUFromLocalnet === Infinity ? DEFAULT_MTU : maxMTUFromLocalnet,
      );
    }
  }, [maxMTUFromLocalnet, mtu, setValue]);

  return (
    <Form className="network-definition">
      <Stack hasGutter>
        <Title headingLevel="h2">{t('Network definition')}</Title>
        <Alert
          isInline
          isPlain
          title={t('This configuration is not editable after the network is created.')}
          variant="info"
        />
      </Stack>

      <FormGroup fieldId="name" isRequired label={t('Name')}>
        <TextInput {...register('network.metadata.name', { required: true })} />
      </FormGroup>
      <FormGroup fieldId="description" label={t('Description')}>
        <TextInput {...register('network.metadata.annotations.description', { required: false })} />
      </FormGroup>

      <FormGroup
        fieldId="bridge-mapping"
        isRequired
        label={t('Physical network')}
        labelHelp={
          <PopoverHelpIcon
            bodyContent={t(
              'The network connects to a physical network through an Open vSwitch bridge.',
            )}
            headerContent={t('Physical network')}
          />
        }
      >
        {physicalNetworkOptions.length > 0 ? (
          <Controller
            control={control}
            name="network.spec.network.localnet.physicalNetworkName"
            render={({ field: { onChange, value } }) => (
              <SelectTypeahead
                id="bridge-mapping"
                options={physicalNetworkOptions}
                selected={value}
                setSelected={(newSelection) => {
                  onChange(newSelection);
                }}
              />
            )}
          />
        ) : (
          <TextInput
            {...register('network.spec.network.localnet.physicalNetworkName', { required: true })}
          />
        )}
      </FormGroup>

      <FormGroup
        fieldId="mtu"
        isRequired
        label={t('MTU')}
        labelHelp={
          <PopoverHelpIcon
            bodyContent={t(
              'The largest size of a data packet, in bytes, that can be transmitted across this network. It is critical that the entire underlying physical network infrastructure also supports the same or larger MTU size to avoid packet fragmentation and connectivity issues.',
            )}
            headerContent={t('Maximum Transmission Unit (MTU)')}
          />
        }
      >
        <Controller
          control={control}
          name="network.spec.network.localnet.mtu"
          render={({ field: { onChange, value } }) => {
            const { message, validated } = getMTUValidatedInfo(value, maxMTUFromLocalnet, t);
            return (
              <>
                <TextInput
                  max={MAX_MTU}
                  min={0}
                  onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
                  type="number"
                  validated={validated}
                  value={value}
                />
                {message && (
                  <FormGroupHelperText validated={validated}>{message}</FormGroupHelperText>
                )}
              </>
            );
          }}
        />
      </FormGroup>
      <Controller
        control={control}
        name="network.spec.network.localnet.vlan"
        render={({ field: { onChange, value: vlan } }) => (
          <>
            <Split hasGutter>
              <Checkbox
                id="vlan-enabled"
                isChecked={!isEmpty(vlan?.mode)}
                label={t('VLAN tagging')}
                onChange={(_, checked) =>
                  onChange(checked ? { access: { id: '' }, mode: VLAN_MODE_ACCESS } : null)
                }
              />
              <SplitItem>
                <PopoverHelpIcon
                  bodyContent={t(
                    "Tags the VirtualMachine's network traffic with a specific VLAN ID (IEEE 802.1Q) to isolate it within a designated virtual network on the physical LAN.",
                  )}
                  headerContent={t('VLAN tagging')}
                />
              </SplitItem>
            </Split>

            {!isEmpty(vlan?.access) && <VLANIDField />}
          </>
        )}
      />
    </Form>
  );
};

export default NetworkDefinition;
