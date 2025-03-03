import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormGroup,
  /*Grid, GridItem,*/ TextInput /*ValidatedOptions*/,
} from '@patternfly/react-core';
// import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
// import { handleBlur } from '@utils/components/FormGroupHelperText/utils/utils';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
// import TechPreview from '@utils/components/TechPreview/TechPreview';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  NetworkAttachmentDefinitionFormInput,
  NetworkTypeKeys,
} from '@views/nads/form/utils/types';

// import { validateIpOrSubnets,validateSubnets } from '../../utils/utils';
// import SubnetsHelperText from '../SubnetsHelperText/SubnetsHelperText';
import './OVNK8sSecondaryLocalnetParameters.scss';

const OVNK8sSecondaryLocalnetParameters: FC = () => {
  const { t } = useNetworkingTranslation();

  const {
    // clearErrors,
    // formState: { errors },
    register,
    // setError,
  } = useFormContext<NetworkAttachmentDefinitionFormInput>();

  const baseId = NetworkTypeKeys.ovnKubernetesSecondaryLocalnet;

  // const excludeSubnetsError = errors?.[baseId]?.excludeSubnets;
  // const subnetsError = errors?.[baseId]?.subnets;

  return (
    <>
      <FormGroup
        isRequired
        label={t('Bridge mapping')}
        labelHelp={
          <PopoverHelpIcon
            bodyContent={t(
              'Physical network name. A bridge mapping must be configured on cluster nodes to map between physical network names and Open vSwitch bridges.',
            )}
          />
        }
      >
        <TextInput
          {...register(`${baseId}.bridgeMapping`, {
            required: true,
          })}
        />
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
