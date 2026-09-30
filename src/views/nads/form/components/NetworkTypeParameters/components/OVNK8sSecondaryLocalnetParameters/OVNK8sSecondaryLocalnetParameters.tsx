import React, { FC, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { FormGroup, /*Grid, GridItem,*/ TextInput, ValidatedOptions } from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
// import TechPreview from '@utils/components/TechPreview/TechPreview';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useOVNBridgeMappings from '@views/nads/form/hooks/useOVNBridgeMappings';
import {
  NetworkAttachmentDefinitionFormInput,
  NetworkTypeKeys,
} from '@views/nads/form/utils/types';

// import { validateIpOrSubnets,validateSubnets } from '../../utils/utils';
// import SubnetsHelperText from '../SubnetsHelperText/SubnetsHelperText';
import './OVNK8sSecondaryLocalnetParameters.scss';

const OVNK8sSecondaryLocalnetParameters: FC = () => {
  const { t } = useNetworkingTranslation();
  const physicalNetworkNames = useOVNBridgeMappings();
  const {
    control,
    formState: { errors },
    register,
    trigger,
  } = useFormContext<NetworkAttachmentDefinitionFormInput>();

  const baseId = NetworkTypeKeys.ovnKubernetesSecondaryLocalnet;
  const fieldName = `${baseId}.bridgeMapping`;
  const bridgeMappingError = errors?.[baseId]?.bridgeMapping;
  const physicalNetworkNamesKey = physicalNetworkNames.join(',');

  useEffect(() => {
    void trigger(fieldName);
  }, [fieldName, physicalNetworkNamesKey, trigger]);

  return (
    <>
      <FormGroup
        fieldId="nads-ovn-physical-network-name"
        isRequired
        label={t('Physical network name')}
        labelHelp={
          <PopoverHelpIcon
            bodyContent={t(
              'Physical network name. A bridge mapping must be configured on cluster nodes to map between physical network names and Open vSwitch bridges.',
            )}
          />
        }
      >
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              data-test="nads-ovn-physical-network-name"
              id="nads-ovn-physical-network-name"
              onBlur={onBlur}
              onChange={(_event, newValue) => onChange(newValue)}
              validated={bridgeMappingError ? ValidatedOptions.error : ValidatedOptions.default}
              value={value || ''}
            />
          )}
          rules={{
            required: true,
            validate: (value: string) =>
              !value || physicalNetworkNames.includes(value.trim())
                ? true
                : t('No matching OVN bridge mapping found for "{{name}}".', { name: value }),
          }}
        />
        {bridgeMappingError?.message && (
          <FormGroupHelperText validated={ValidatedOptions.error}>
            {bridgeMappingError.message}
          </FormGroupHelperText>
        )}
      </FormGroup>
      <FormGroup label={t('MTU')}>
        <TextInput {...register(`${baseId}.mtu`)} />
      </FormGroup>
      <FormGroup label={t('VLAN')}>
        <TextInput {...register(`${baseId}.vlanID`)} />
      </FormGroup>
      {/* <FormGroup label={t('Subnets')} labelIcon={<TechPreview />}>
        <TextInput
          {...register(`${baseId}.subnets`, {
            onBlur: (event) =>
              handleBlur({
                clearErrors,
                event,
                fieldName: `${baseId}.subnets`,
                setError,
                validate: validateSubnets,
              }),
            validate: validateSubnets,
          })}
        />
        <FormGroupHelperText
          validated={subnetsError ? ValidatedOptions.error : ValidatedOptions.default}
        >
          {subnetsError ? subnetsError?.message : <SubnetsHelperText />}
        </FormGroupHelperText>
      </FormGroup>
      <FormGroup>
        <Grid hasGutter>
          <GridItem span={1} />
          <GridItem className="exclude-label" span={1}>
            {t('Exclude')}
          </GridItem>
          <GridItem span={10}>
            <TextInput
              label={t('Exclude')}
              placeholder={t('Type in excluded subnets (CIDRs or IP addresses)')}
              {...register(`${baseId}.excludeSubnets`, {
                onBlur: (event) =>
                  handleBlur({
                    clearErrors,
                    event,
                    fieldName: `${baseId}.excludeSubnets`,
                    setError,
                    validate: validateIpOrSubnets,
                  }),
                validate: validateIpOrSubnets,
              })}
            />
            <FormGroupHelperText
              validated={excludeSubnetsError ? ValidatedOptions.error : ValidatedOptions.default}
            >
              {excludeSubnetsError?.message}
            </FormGroupHelperText>
          </GridItem>
        </Grid>
      </FormGroup> */}
    </>
  );
};

export default OVNK8sSecondaryLocalnetParameters;
