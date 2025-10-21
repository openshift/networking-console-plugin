import React, { FC, useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { K8sResourceCommon, MatchExpression } from '@openshift-console/dynamic-plugin-sdk';
import { SelectOptionProps } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import FailedToGetProjectsAlert from '@utils/components/ProjectsPrimaryUDNAlerts/FailedToGetProjectsAlert';
import SelectMultiTypeahead from '@utils/components/SelectMultiTypeahead/SelectMultiTypeahead';
import { getName } from '@utils/resources/shared';
import { PROJECT_LABEL_FOR_MATCH_EXPRESSION } from '@utils/resources/udns/constants';

import { VMNetworkForm } from '../constants';

import SelectedProjects from './SelectedProjects';

type ProjectListProps = {
  errorLoadingProjects: any;
  loadedProjects: boolean;
  projects: K8sResourceCommon[];
};

const ProjectList: FC<ProjectListProps> = ({ errorLoadingProjects, loadedProjects, projects }) => {
  const { control, watch } = useFormContext<VMNetworkForm>();

  const matchExpressions = watch('network.spec.namespaceSelector.matchExpressions');
  const projectOptions = useMemo(
    () =>
      projects?.map(
        (project): SelectOptionProps => ({
          hasCheckbox: true,
          value: getName(project),
        }),
      ),
    [projects],
  );

  const transformProjectsIntoMatchExpressions = useCallback(
    (selected: string[]): MatchExpression[] => [
      {
        key: PROJECT_LABEL_FOR_MATCH_EXPRESSION,
        operator: 'In',
        values: selected,
      },
    ],
    [],
  );

  if (!loadedProjects) return <Loading />;

  if (errorLoadingProjects) return <FailedToGetProjectsAlert error={errorLoadingProjects} />;

  return (
    <>
      <Controller
        control={control}
        name="network.spec.namespaceSelector.matchExpressions"
        render={({ field: { onChange, value } }) => (
          <SelectMultiTypeahead
            options={projectOptions}
            selected={value?.map((expr) => expr.values).flat() || []}
            setSelected={(newSelection) => {
              onChange(transformProjectsIntoMatchExpressions(newSelection));
            }}
          />
        )}
      />
      {matchExpressions?.length > 0 && <SelectedProjects />}
    </>
  );
};

export default ProjectList;
