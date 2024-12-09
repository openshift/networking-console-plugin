import React, { FC, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Operator, ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { ExpandableSection, FormGroup, List, ListItem } from '@patternfly/react-core';
import SelectMultiTypeahead from '@utils/components/SelectMultiTypeahead/SelectMultiTypeahead';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { PROJECT_LABEL_FOR_MATCH_EXPRESSION } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

import { ProjectGroupVersionKind } from '../constants';
import useProjects from '../hooks/useProjects';

const ClusterUDNNamespaceSelector: FC = () => {
  const { t } = useNetworkingTranslation();

  const [projects] = useProjects();

  const { setValue, watch } = useFormContext<ClusterUserDefinedNetworkKind>();

  const matchExpressions = watch('spec.namespaceSelector.matchExpressions');

  const matchingProjectNames = matchExpressions?.[0]?.values;

  const matchingProjects = projects?.filter((project) =>
    matchingProjectNames?.includes(getName(project)),
  );

  const [isExpanded, setIsExpanded] = React.useState(false);

  const onToggle = (_event: React.MouseEvent, expanded: boolean) => {
    setIsExpanded(expanded);
  };

  const handleChange = (newSelection) => {
    setValue('spec.namespaceSelector.matchExpressions', [
      { key: PROJECT_LABEL_FOR_MATCH_EXPRESSION, operator: Operator.In, values: newSelection },
    ]);
  };

  const projectsOptions = useMemo(
    () =>
      projects.map((project) => ({
        children: (
          <>
            <ResourceIcon groupVersionKind={ProjectGroupVersionKind} />

            {getName(project)}
          </>
        ),
        value: getName(project),
      })),
    [projects],
  );

  return (
    <FormGroup fieldId="cluster-udn-projects" isRequired label={t('Project(s)')}>
      <SelectMultiTypeahead
        options={projectsOptions}
        placeholder={t('Select a Project')}
        selected={matchingProjectNames}
        setSelected={handleChange}
      ></SelectMultiTypeahead>

      <ExpandableSection
        isExpanded={isExpanded}
        onToggle={onToggle}
        toggleText={isExpanded ? t('Hide selected project(s)') : t('Review selected project(s)')}
      >
        <List isPlain>
          {matchingProjects.map((project) => (
            <ListItem key={getName(project)}>
              <ResourceIcon groupVersionKind={ProjectGroupVersionKind} /> {getName(project)}
            </ListItem>
          ))}

          {matchingProjects.length === 0 && t('No matching projects')}
        </List>
      </ExpandableSection>
    </FormGroup>
  );
};

export default ClusterUDNNamespaceSelector;
