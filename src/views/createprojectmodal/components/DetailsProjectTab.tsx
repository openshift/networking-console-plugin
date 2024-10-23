import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormGroup, TextArea, TextInput } from '@patternfly/react-core';

import {
  CreateProjectModalFormState,
  DESCRIPTION_ANNOTATION,
  DISPLAY_NAME_ANNOTATION,
} from '../constants';

import ProjectNamePopover from './ProjectNamePopover';

const DetailsProjectTab: FC = ({}) => {
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext<CreateProjectModalFormState>();

  const annotations = watch('project.metadata.annotations');

  const description = annotations[DESCRIPTION_ANNOTATION];
  const displayName = annotations[DISPLAY_NAME_ANNOTATION];

  const changeAnnotations = (newDescription: string, newDisplayName: string) => {
    setValue('project.metadata.annotations', {
      [DESCRIPTION_ANNOTATION]: newDescription,
      [DISPLAY_NAME_ANNOTATION]: newDisplayName,
    });
  };

  return (
    <>
      <FormGroup
        fieldId="input-name"
        isRequired
        label={t('Name')}
        labelIcon={<ProjectNamePopover />}
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
          onChange={(_, newValue) => changeAnnotations(description, newValue)}
          type="text"
          value={displayName}
        />
      </FormGroup>
      <FormGroup fieldId="input-description" label={t('Description')}>
        <TextArea
          id="input-description"
          name="description"
          onChange={(_, newValue) => changeAnnotations(newValue, displayName)}
          value={description}
        />
      </FormGroup>
    </>
  );
};

export default DetailsProjectTab;
