import React, { FC, MouseEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { ExpandableSection, FormSection, List, ListItem } from '@patternfly/react-core';
import MatchLabels from '@utils/components/MatchLabels/MatchLabels';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ProjectGroupVersionKind } from '@utils/hooks/useProjects/constants';
import useProjects from '@utils/hooks/useProjects/useProjects';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { match } from '@utils/utils';

const ClusterUDNNamespaceSelector: FC = () => {
  const { t } = useNetworkingTranslation();

  const [projects] = useProjects();

  const { setValue, watch } = useFormContext<ClusterUserDefinedNetworkKind>();

  const [isExpanded, setIsExpanded] = useState(false);

  const onToggle = (_event: MouseEvent, expanded: boolean) => {
    setIsExpanded(expanded);
  };

  const matchLabels = watch('spec.namespaceSelector.matchLabels');

  const matchingProjects = projects?.filter((project) => match(project, matchLabels));

  return (
    <FormSection title={t('Namespace(s)')} titleElement="h2">
      <MatchLabels
        matchLabels={matchLabels}
        onChange={(newMatchLabels) =>
          setValue('spec.namespaceSelector.matchLabels', newMatchLabels)
        }
      />

      <ExpandableSection
        isExpanded={isExpanded}
        onToggle={onToggle}
        toggleText={
          isExpanded ? t('Hide selected Namespace(s)') : t('Review selected Namespace(s)')
        }
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
    </FormSection>
  );
};

export default ClusterUDNNamespaceSelector;
