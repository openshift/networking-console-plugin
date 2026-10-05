import React, { FC, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { FormGroup, SelectOption } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import SelectTypeahead from '@utils/components/SelectTypeahead/SelectTypeahead';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ProjectGroupVersionKind } from '@utils/hooks/useProjects/constants';
import useProjects from '@utils/hooks/useProjects/useProjects';
import { getName } from '@utils/resources/shared';

import { PRIMARY_USER_DEFINED_LABEL, PROJECT_NAME } from '../constants';

import { UDNForm } from './constants';

type SelectProjectProps = {
  labeledOnly?: boolean;
};

const SelectProject: FC<SelectProjectProps> = ({ labeledOnly = true }) => {
  const { t } = useNetworkingTranslation();

  const { control } = useFormContext<UDNForm>();

  const [projects, loaded] = useProjects();
  const visibleProjects = useMemo(
    () =>
      (projects ?? []).filter(
        (project) =>
          !labeledOnly || project?.metadata?.labels?.[PRIMARY_USER_DEFINED_LABEL] !== undefined,
      ),
    [labeledOnly, projects],
  );

  const projectsOptions = useMemo(
    () =>
      visibleProjects.map((project) => ({
        children: (
          <>
            {' '}
            <ResourceIcon groupVersionKind={ProjectGroupVersionKind} /> {getName(project)}{' '}
          </>
        ),
        key: getName(project),
        value: getName(project),
      })),
    [visibleProjects],
  );

  if (!loaded) return <Loading />;

  return (
    <FormGroup fieldId="input-project-name" isRequired label={t('Project name')}>
      <Controller
        control={control}
        name={PROJECT_NAME}
        render={({ field: { onChange, value: selectedProjectName } }) => (
          <SelectTypeahead
            id="select-project"
            options={projectsOptions}
            placeholder={t('Select a Project')}
            selected={selectedProjectName}
            setSelected={(newSelection) => onChange(newSelection)}
          >
            <>
              {visibleProjects?.map((project) => {
                const projectName = getName(project);
                return (
                  <SelectOption
                    key={projectName}
                    onClick={() => onChange(projectName)}
                    value={projectName}
                  >
                    <ResourceIcon groupVersionKind={ProjectGroupVersionKind} />

                    {projectName}
                  </SelectOption>
                );
              })}
            </>
          </SelectTypeahead>
        )}
        rules={{ required: true }}
      />
    </FormGroup>
  );
};

export default SelectProject;
