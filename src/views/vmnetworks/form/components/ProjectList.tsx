import React, { FC, useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { MatchExpression } from '@openshift-console/dynamic-plugin-sdk';
import { SelectOptionProps } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import SelectMultiTypeahead from '@utils/components/SelectMultiTypeahead/SelectMultiTypeahead';
import { getName } from '@utils/resources/shared';
import { PROJECT_LABEL_FOR_MATCH_EXPRESSION } from '@utils/resources/udns/constants';

import { VMNetworkForm } from '../constants';
import useUDNProjects from '../hook/useUDNProjects';

import SelectedProjects from './SelectedProjects';

const ProjectList: FC = () => {
  const { control, watch } = useFormContext<VMNetworkForm>();
  const [projects, loaded] = useUDNProjects();

  const matchExpressions = watch('network.spec.namespaceSelector.matchExpressions');
  const projectOptions = useMemo(
    () =>
      projects?.map((project): SelectOptionProps => ({
        hasCheckbox: true,
        value: getName(project),
      })),
    [projects],
  );

  const transformProjectsIntoMatchExpressions = useCallback(
    (selected: string[]): MatchExpression[] => {
      return selected.map((name) => ({
        key: PROJECT_LABEL_FOR_MATCH_EXPRESSION,
        operator: 'In',
        values: [name],
      }));
    },
    [],
  );

  if (!loaded) return <Loading />;

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
