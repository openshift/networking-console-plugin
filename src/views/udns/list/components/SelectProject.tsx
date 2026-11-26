import React, { FC, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { FormGroup } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import SelectTypeahead, {
  SelectTypeaheadOptionProps,
} from '@utils/components/SelectTypeahead/SelectTypeahead';
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

  const projectsOptions: SelectTypeaheadOptionProps[] = useMemo(
    () =>
      visibleProjects
        .map((project) => getName(project))
        .filter((projectName): projectName is string => projectName !== undefined)
        .map((projectName) => ({
          key: projectName,
          optionProps: {
            children: (
              <>
                {' '}
                <ResourceIcon groupVersionKind={ProjectGroupVersionKind} /> {projectName}{' '}
              </>
            ),
          },
          value: projectName,
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
            options={projectsOptions}
            placeholder={t('Select a Project')}
            selectedValue={selectedProjectName}
            setSelectedValue={(newSelection) => onChange(newSelection)}
          />
        )}
        rules={{ required: true }}
      />
    </FormGroup>
  );
};

export default SelectProject;
