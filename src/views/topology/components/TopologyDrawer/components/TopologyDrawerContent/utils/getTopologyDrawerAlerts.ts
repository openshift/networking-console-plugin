import { TFunction } from 'i18next';

import { getConfigAsJSON, getType } from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { NETWORK_ALLOCATION_SUCCEEDED, NETWORK_CREATED } from '@utils/resources/udns/constants';
import { getCUDNNamespaceNames } from '@utils/resources/udns/helper';
import { getUDNConditions } from '@utils/resources/udns/selectors';
import {
  ClusterUserDefinedNetworkKind,
  UDNCondition,
  UserDefinedNetworkKind,
} from '@utils/resources/udns/types';
import { SelectedNodeData } from '@views/topology/context/TopologyContext';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';
import { ResourceType } from '@views/topology/utils/constants';

export type TopologyDrawerAlert = {
  key: string;
  message?: string;
  title: string;
  variant: 'danger' | 'warning';
};

const getConditionMessage = (condition: UDNCondition, fallback: string) =>
  condition.message || condition.reason || fallback;

const getUDNAlerts = (
  selectedNode: SelectedNodeData,
  resources: NetworkTopologyResources | undefined,
  t: TFunction,
): TopologyDrawerAlert[] => {
  const udn = selectedNode.resource as ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
  const conditions = getUDNConditions(udn);
  const requiredConditions = [NETWORK_CREATED, NETWORK_ALLOCATION_SUCCEEDED];
  const failedConditions = requiredConditions
    .map((type) => conditions.find((condition) => condition.type === type))
    .filter((condition): condition is UDNCondition => condition?.status === 'False');

  const alerts: TopologyDrawerAlert[] = failedConditions.map((condition) => ({
    key: condition.type,
    message: getConditionMessage(
      condition,
      t('Check the resource conditions for more information.'),
    ),
    title:
      condition.type === NETWORK_CREATED
        ? t('Network creation failed')
        : t('Network allocation failed'),
    variant: 'danger' as const,
  }));

  if (
    alerts.length === 0 &&
    !requiredConditions.every((type) =>
      conditions.some((condition) => condition.type === type && condition.status === 'True'),
    )
  )
    alerts.push({
      key: 'network-configuration-in-progress',
      message: t('Waiting for the {{conditions}} conditions.', {
        conditions: requiredConditions.join(' and '),
      }),
      title: t('Network configuration in progress'),
      variant: 'warning',
    });

  if (
    selectedNode.resourceType === ResourceType.ClusterUserDefinedNetwork &&
    resources?.projects &&
    getCUDNNamespaceNames(udn as ClusterUserDefinedNetworkKind, resources.projects).length === 0
  )
    alerts.push({
      key: 'no-matched-namespaces',
      message: t('Update the namespace selector or add matching namespaces.'),
      title: t('No namespaces currently match this network'),
      variant: 'warning',
    });

  return alerts;
};

const getNADAlerts = (
  resource: NetworkAttachmentDefinitionKind,
  t: TFunction,
): TopologyDrawerAlert[] => {
  const config = getConfigAsJSON(resource);

  if (!config) {
    return [
      {
        key: 'invalid-nad-configuration',
        message: t('The NetworkAttachmentDefinition configuration cannot be parsed.'),
        title: t('Invalid network configuration'),
        variant: 'danger',
      },
    ];
  }

  if (!getType(config)) {
    return [
      {
        key: 'incomplete-nad-configuration',
        message: t('The NetworkAttachmentDefinition configuration does not specify a CNI type.'),
        title: t('Incomplete network configuration'),
        variant: 'danger',
      },
    ];
  }

  return [];
};

export const getTopologyDrawerAlerts = (
  selectedNode: SelectedNodeData,
  resources: NetworkTopologyResources | undefined,
  t: TFunction,
): TopologyDrawerAlert[] => {
  switch (selectedNode.resourceType) {
    case ResourceType.NetworkAttachmentDefinition:
      return getNADAlerts(selectedNode.resource as NetworkAttachmentDefinitionKind, t);
    case ResourceType.UserDefinedNetwork:
    case ResourceType.ClusterUserDefinedNetwork:
      return getUDNAlerts(selectedNode, resources, t);
    default:
      return [];
  }
};
