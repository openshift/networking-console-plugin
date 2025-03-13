import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormGroup, TextArea, TextInput } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { CreateProjectModalFormState } from '../types';

import ProjectNamePopover from './ProjectNamePopover';

const DetailsProjectTab: FC = ({}) => {
  const { t } = useNetworkingTranslation();
  const { register, setValue } = useFormContext<CreateProjectModalFormState>();

  return (
    <>
      <FormGroup
        fieldId="input-name"
        isRequired
        label={t('Name')}
        labelHelp={<ProjectNamePopover />}
      >
        <TextInput
          autoFocus
          data-test="input-name"
          id="input-name"
          name="name"
          {...register('project.metadata.name', {
            onChange: (event) => setValue('udn.metadata.namespace', event?.target?.value),
            required: true,
          })}
          isRequired
          type="text"
        />
      </FormGroup>
      <FormGroup fieldId="input-display-name" label={t('Display name')}>
        <TextInput
          id="input-display-name"
          name="displayName"
          {...register('project.displayName')}
          type="text"
        />
      </FormGroup>
      <FormGroup fieldId="input-description" label={t('Description')}>
        <TextArea id="input-description" name="description" {...register('project.description')} />
      </FormGroup>
    </>
  );
};

export default DetailsProjectTab;
