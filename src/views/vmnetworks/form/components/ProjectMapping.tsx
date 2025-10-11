import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Radio, Title } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useNonSystemProjects from '@utils/hooks/useNonSystemProjects';

import { VMNetworkForm } from '../constants';

import ProjectList from './ProjectList';
import ProjectNamespaceSelector from './ProjectNamespaceSelector';

const ProjectMapping: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control, setValue, watch } = useFormContext<VMNetworkForm>();

  const showProjectList = watch('showProjectList');

  const [projects, loadedProjects, errorLoadingProjects] = useNonSystemProjects();

  return (
    <>
      <Title headingLevel="h2">{t('Project mapping')}</Title>
      <p>
        {t(
          'You can select projects from the list or select labels to specify qualifying projects.',
        )}
      </p>

      <Controller
        control={control}
        name="showProjectList"
        render={({ field: { onChange, value } }) => (
          <Radio
            id="project-list"
            isChecked={value}
            label={t('Select projects from list')}
            name="project-list"
            onChange={(_, checked) => {
              setValue('network.spec.namespaceSelector', { matchExpressions: [] });
              onChange(checked);
            }}
          />
        )}
      />

      {showProjectList && (
        <ProjectList
          errorLoadingProjects={errorLoadingProjects}
          loadedProjects={loadedProjects}
          projects={projects}
        />
      )}

      <Controller
        control={control}
        name="showProjectList"
        render={({ field: { onChange, value } }) => (
          <Radio
            description={t('Ensure the projects for this network have the labels you specified.')}
            id="project-labels"
            isChecked={!value}
            label={t('Select labels to specify qualifying projects')}
            name="project-labels"
            onChange={(_, checked) => {
              setValue('network.spec.namespaceSelector', { matchLabels: {} });
              onChange(!checked);
            }}
          />
        )}
      />

      {!showProjectList && <ProjectNamespaceSelector />}
    </>
  );
};

export default ProjectMapping;
