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
import { udnIsReady } from '@utils/resources/udns/helper';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { ResourceType } from '@views/topology/utils/constants';

import {
  getConnectedResources,
  getExpectedNetworkBridge,
  getNetworkPolicies,
  getPhysicalNetworkName,
  getWorkerBridgeAttachments,
  isHostManagedNetwork,
} from './resourcesUtils';

const NetworkResourcesTab: FC = () => {
  const { t } = useNetworkingTranslation();
  const { nmstateAvailable, nodeNetworkPolicies, nodeNetworkStates, resources, selectedNode } =
    useTopologyContext();

  if (!selectedNode) return null;

  const { resource, resourceType } = selectedNode;
  const isUDN =
    resourceType === ResourceType.UserDefinedNetwork ||
    resourceType === ResourceType.ClusterUserDefinedNetwork;
  const isHostManaged = isHostManagedNetwork(resource, resourceType);
  const physicalNetworkName = getPhysicalNetworkName(resource, resourceType);
  const workerAttachments = getWorkerBridgeAttachments(physicalNetworkName, nodeNetworkStates);
  const policies = getNetworkPolicies(physicalNetworkName, nodeNetworkPolicies);
  const connectedResources = getConnectedResources(resources, resource).filter(
    (connectedResource) =>
      connectedResource.kind === ResourceType.Pod ||
      connectedResource.kind === ResourceType.VirtualMachine,
  );
  const expectedBridge = getExpectedNetworkBridge(resource, resourceType);
  const workers = nodeNetworkStates.map(getName).filter(Boolean).sort();
  const hasNetworkSummary = Boolean(isUDN || physicalNetworkName || expectedBridge);

  return (
    <div className="pf-v6-u-pt-md">
      {isHostManaged && (
        <section className="pf-v6-u-mb-lg">
          <Title headingLevel="h2" size="lg">
            {t('Discovered attachments')}
          </Title>
          {nmstateAvailable && workerAttachments.length ? (
            <UnorderedList className="pf-v6-u-mt-sm">
              {workerAttachments.map(({ bridge, nodeName }) => (
                <li key={`${nodeName}-${bridge}`}>
                  {t('{{node}}: {{bridge}}', { bridge, node: nodeName })}
                </li>
              ))}
            </UnorderedList>
          ) : (
            <EmptyState titleText={t('No host-network attachments discovered')}>
              <EmptyStateBody>
                {nmstateAvailable
                  ? t('No worker bridge mappings were found for this network.')
                  : t('Install the Kubernetes NMState Operator to discover worker attachments.')}
              </EmptyStateBody>
            </EmptyState>
          )}

          {nmstateAvailable && (
            <>
              <Title className="pf-v6-u-mt-lg" headingLevel="h3" size="md">
                {t('Node network configuration policies')}
              </Title>
              {policies.length ? (
                <UnorderedList className="pf-v6-u-mt-sm">
                  {policies.map((policy) => (
                    <li key={getName(policy)}>
                      <ResourceLink
                        groupVersionKind={getGroupVersionKindForResource(policy)}
                        name={getName(policy)}
                        namespace={null}
                      />
                    </li>
                  ))}
                </UnorderedList>
              ) : (
                <p className="pf-v6-u-color-200 pf-v6-u-mt-sm">
                  {t('No matching NodeNetworkConfigurationPolicy resources found.')}
                </p>
              )}
            </>
          )}
        </section>
      )}

      {isUDN && !isHostManaged && (
        <section className="pf-v6-u-mb-lg">
          <Title headingLevel="h2" size="lg">
            {t('Workers')}
          </Title>
          {nmstateAvailable && workers.length ? (
            <UnorderedList className="pf-v6-u-mt-sm">
              {workers.map((worker) => (
                <li key={worker}>{worker}</li>
              ))}
            </UnorderedList>
          ) : (
            <EmptyState titleText={t('Worker discovery is unavailable')}>
              <EmptyStateBody>
                {nmstateAvailable
                  ? t('No worker network state is available.')
                  : t('Install the Kubernetes NMState Operator to discover workers.')}
              </EmptyStateBody>
            </EmptyState>
          )}
        </section>
      )}

      {hasNetworkSummary && (
        <section className="pf-v6-u-mb-lg">
          <Title headingLevel="h2" size="lg">
            {t('Network summary')}
          </Title>
          <DescriptionList className="pf-v6-u-mt-sm">
            {isUDN && (
              <DescriptionListItem
                description={
                  udnIsReady(resource as ClusterUserDefinedNetworkKind | UserDefinedNetworkKind)
                    ? t('Ready')
                    : t('Not ready')
                }
                term={t('Status')}
              />
            )}
            {physicalNetworkName && (
              <DescriptionListItem description={physicalNetworkName} term={t('Physical network')} />
            )}
            {expectedBridge && (
              <DescriptionListItem description={expectedBridge} term={t('Expected bridge')} />
            )}
          </DescriptionList>
        </section>
      )}

      <section>
        <Title headingLevel="h2" size="lg">
          {t('Workloads')}
        </Title>
        {connectedResources.length ? (
          <UnorderedList className="pf-v6-u-mt-sm">
            {connectedResources.map((connectedResource) => (
              <li
                key={`${connectedResource.kind}-${getNamespace(connectedResource)}-${getName(connectedResource)}`}
              >
                <ResourceLink
                  groupVersionKind={getGroupVersionKindForResource(connectedResource)}
                  name={getName(connectedResource)}
                  namespace={getNamespace(connectedResource)}
                />
              </li>
            ))}
          </UnorderedList>
        ) : (
          <EmptyState titleText={t('No connected workloads')}>
            <EmptyStateBody>
              {t('No Pods or virtual machines currently use this network.')}
            </EmptyStateBody>
          </EmptyState>
        )}
      </section>
    </div>
  );
};

export default NetworkResourcesTab;
