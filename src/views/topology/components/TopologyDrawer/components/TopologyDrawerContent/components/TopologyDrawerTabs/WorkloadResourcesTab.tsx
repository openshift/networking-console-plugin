import React, { FC } from 'react';

import {
  getGroupVersionKindForResource,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, Title } from '@patternfly/react-core';
import DescriptionList from '@utils/components/DescriptionList/DescriptionList';
import DescriptionListItem from '@utils/components/DescriptionList/DescriptionListItem';
import UnorderedList from '@utils/components/UnorderedList/UnorderedList';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { ResourceType } from '@views/topology/utils/constants';

import { getWorkloadAttachments, getWorkloadPrimaryNetwork } from './resourcesUtils';

const WorkloadResourcesTab: FC = () => {
  const { t } = useNetworkingTranslation();
  const { resources, selectedNode } = useTopologyContext();

  if (!selectedNode || !resources) return null;

  const primaryNetwork = getWorkloadPrimaryNetwork(selectedNode.resource, resources);
  const attachments = getWorkloadAttachments(
    selectedNode.resource,
    selectedNode.resourceType as ResourceType.Pod | ResourceType.VirtualMachine,
    resources.networkAttachmentDefinitions,
  );
  const interfaces = attachments.flatMap(({ binding, interfaceName }) =>
    interfaceName ? [binding ? `${interfaceName} · ${binding}` : interfaceName] : [],
  );

  return (
    <div className="pf-v6-u-pt-md">
      <Title headingLevel="h2" size="lg">
        {t('Network attachment')}
      </Title>
      <DescriptionList className="pf-v6-u-mt-md">
        <DescriptionListItem
          description={
            primaryNetwork ? (
              <ResourceLink
                groupVersionKind={getGroupVersionKindForResource(primaryNetwork)}
                name={getName(primaryNetwork)}
                namespace={getNamespace(primaryNetwork)}
              />
            ) : (
              t('Default cluster network')
            )
          }
          term={t('Primary network')}
        />
        <DescriptionListItem
          description={
            attachments.length ? (
              <UnorderedList>
                {attachments.map(({ nad, reference }) => (
                  <li key={reference}>
                    {nad ? (
                      <ResourceLink
                        groupVersionKind={getGroupVersionKindForResource(nad)}
                        name={getName(nad)}
                        namespace={getNamespace(nad)}
                      />
                    ) : (
                      reference
                    )}
                  </li>
                ))}
              </UnorderedList>
            ) : (
              t('None')
            )
          }
          term={t('Multus / NAD')}
        />
        <DescriptionListItem
          description={interfaces.length ? interfaces.join(', ') : t('Not available')}
          term={t('Interface')}
        />
      </DescriptionList>
      {!attachments.length && (
        <EmptyState titleText={t('No secondary network attachments')}>
          <EmptyStateBody>
            {t('This workload has no configured Multus network attachments.')}
          </EmptyStateBody>
        </EmptyState>
      )}
    </div>
  );
};

export default WorkloadResourcesTab;
