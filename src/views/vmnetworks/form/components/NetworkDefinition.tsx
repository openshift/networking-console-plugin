import React, { FC, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Checkbox,
  Form,
  FormGroup,
  Split,
  SplitItem,
  TextInput,
  Title,
  ValidatedOptions,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import SelectTypeahead from '@utils/components/SelectTypeahead/SelectTypeahead';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { VLAN_MODE_ACCESS } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import { DEFAULT_MTU, VMNetworkForm } from '../constants';
import useMaxMTU from '../hooks/useMaxMTU';
import useNodeNetworkMappingOptions from '../hooks/useNodeNetworkMappingOptions';

import VLANIDField from './VLANIDField';

import './NetworkDefinition.scss';

const NetworkDefinition: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control, register, setValue, watch } = useFormContext<VMNetworkForm>();

  const localnet = watch('network.spec.network.localnet.physicalNetworkName');

  const [nodeNetworkMappingOptions, nncpSpecListForLocalnet] = useNodeNetworkMappingOptions();
  const maxMTU = useMaxMTU(localnet, nncpSpecListForLocalnet);

  useEffect(() => {
    setValue('network.spec.network.localnet.mtu', maxMTU === Infinity ? DEFAULT_MTU : maxMTU);
  }, [maxMTU, setValue]);

  return (
    <Form className="network-definition">
      <Title headingLevel="h2">{t('Network definition')}</Title>
      <p>{t('This configuration is not editable after the network is created.')}</p>

      <FormGroup fieldId="name" isRequired label={t('Name')}>
        <TextInput {...register('network.metadata.name', { required: true })} />
      </FormGroup>
      <FormGroup fieldId="description" label={t('Description')}>
        <TextInput {...register('network.metadata.annotations.description', { required: false })} />
      </FormGroup>

      <FormGroup
        fieldId="bridge-mapping"
        isRequired
        label={t('Node network mapping')}
        labelHelp={
          <PopoverHelpIcon
            bodyContent={t(
              'The network connects to a physical network through an Open vSwitch bridge.',
            )}
            headerContent={t('Node network mapping')}
          />
        }
      >
        {nodeNetworkMappingOptions.length > 0 ? (
          <Controller
            control={control}
            name="network.spec.network.localnet.physicalNetworkName"
            render={({ field: { onChange, value } }) => (
              <SelectTypeahead
                id="bridge-mapping"
                options={nodeNetworkMappingOptions}
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
            const validated = value > maxMTU ? ValidatedOptions.warning : ValidatedOptions.default;
            return (
              <>
                <TextInput
                  min={0}
                  onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
                  type="number"
                  validated={validated}
                  value={value}
                />
                {value > maxMTU && (
                  <FormGroupHelperText validated={validated}>
                    {t(
                      'MTU is higher than {{maxMTU}} bytes, which is a maximum that the selected node network can guarantee. This may cause packet fragmentation.',
                      { maxMTU },
                    )}
                  </FormGroupHelperText>
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
