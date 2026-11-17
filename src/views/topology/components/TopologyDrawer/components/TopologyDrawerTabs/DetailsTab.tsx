import React, { FC } from 'react';
import type { TFunction } from 'i18next';

import { NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import {
  getGroupVersionKindForModel,
  getGroupVersionKindForResource,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { DescriptionList } from '@patternfly/react-core';
import DescriptionDetails from '@utils/components/DescriptionDetails/DescriptionDetails';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getConfigAsJSON, getPodNetworkAttachments } from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import {
  getAnnotations,
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getUID,
} from '@utils/resources/shared';
import { getCUDNNamespaceNames, udnIsReady } from '@utils/resources/udns/helper';
import { getNetwork, getUDNConditions } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { getInterfaces, getNetworks, getVMStatus } from '@utils/resources/vm/selectors';
import { getPodPhase } from '@views/services/details/tabs/pods/utils';
import { SelectedNodeData, useTopologyContext } from '@views/topology/context/TopologyContext';
import { NetworkTopologyResources } from '@views/topology/hooks/useNetworkTopologyResources';

const getResourceDetails = (
  selectedNode: SelectedNodeData,
  resources: NetworkTopologyResources | undefined,
  t: TFunction,
) => {
  const { resource } = selectedNode;
  switch (selectedNode.resourceType) {
    case 'NetworkAttachmentDefinition': {
      const config = getConfigAsJSON(resource as NetworkAttachmentDefinitionKind);
      const plugin = config?.plugins?.[0] || config;
      return [
        [t('CNI type'), plugin?.type],
        [t('Bridge'), plugin?.bridge],
        [t('IPAM'), plugin?.ipam?.type || plugin?.ipam?.subnet],
        [t('MTU'), plugin?.mtu],
        [t('VLAN'), plugin?.vlan ?? plugin?.vlanID],
        [t('Physical network'), plugin?.physicalNetworkName],
      ];
    }
    case 'UserDefinedNetwork':
    case 'ClusterUserDefinedNetwork': {
      const udn = resource as ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
      const network = getNetwork(udn);
      const layer = network?.layer2 || network?.layer3 || network?.localnet;
      const subnets = layer?.subnets
        ?.map((subnet) => (typeof subnet === 'string' ? subnet : subnet.cidr))
        .join(', ');
      const matchedNamespaces =
        selectedNode.resourceType === 'ClusterUserDefinedNetwork'
          ? getCUDNNamespaceNames(udn as ClusterUserDefinedNetworkKind, resources?.projects).join(
              ', ',
            )
          : undefined;
      return [
        [t('Topology'), network?.topology],
        [t('Role'), layer?.role],
        [t('Subnets'), subnets],
        [
          t('Join subnets'),
          network?.layer2?.joinSubnets?.join(', ') || network?.layer3?.joinSubnets?.join(', '),
        ],
        [t('MTU'), layer?.mtu],
        [
          t('IPAM'),
          network?.layer2?.ipam?.mode ||
            network?.layer2?.ipam?.lifecycle ||
            network?.localnet?.ipam?.mode ||
            network?.localnet?.ipam?.lifecycle,
        ],
        [t('VLAN'), network?.localnet?.vlan?.access?.id],
        [
          t('Conditions'),
          getUDNConditions(udn)
            .map((condition) => condition.type)
            .join(', '),
        ],
        [t('Matched namespaces'), matchedNamespaces],
      ];
    }
    case 'Pod': {
      const pod = resource as IoK8sApiCoreV1Pod;
      return [
        [t('Phase'), getPodPhase(pod)],
        [t('Pod IP'), pod.status?.podIP],
        [t('Node IP'), pod.status?.hostIP],
        [t('Node name'), pod.spec?.nodeName],
        [t('Multus networks'), getPodNetworkAttachments(pod).join(', ')],
      ];
    }
    case 'VirtualMachine': {
      const vm = resource as V1VirtualMachine;
      const interfaces = getInterfaces(vm);
      return [
        [t('Status'), getVMStatus(vm)],
        [
          t('Networks'),
          getNetworks(vm)
            .map((network) => network.multus?.networkName || network.name)
            .join(', '),
        ],
        [
          t('Interfaces'),
          interfaces
            .map(
              (iface) =>
                `${iface.name}${iface.binding ? ` (${Object.keys(iface.binding)[0]})` : ''}`,
            )
            .join(', '),
        ],
      ];
    }
    default:
      return [];
  }
};

const getResourceStatus = (selectedNode: SelectedNodeData, t: TFunction) => {
  const { resource } = selectedNode;

  switch (selectedNode.resourceType) {
    case 'Pod':
      return getPodPhase(resource as IoK8sApiCoreV1Pod);
    case 'VirtualMachine':
      return getVMStatus(resource as V1VirtualMachine);
    case 'UserDefinedNetwork':
    case 'ClusterUserDefinedNetwork':
      return udnIsReady(resource) ? t('Ready') : t('Not ready');
    case 'NetworkAttachmentDefinition':
      return t('Configured');
    default:
      return undefined;
  }
};

const DetailsTab: FC = () => {
  const { t } = useNetworkingTranslation();
  const { resources, selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  const { resource } = selectedNode;
  const resourceNamespace = getNamespace(resource);
  const resourceGroupVersionKind = getGroupVersionKindForResource(resource);
  const resourceDetails = getResourceDetails(selectedNode, resources, t);

  const status = getResourceStatus(selectedNode, t);

  return (
    <DescriptionList className="pf-v6-u-pt-md">
      <DetailsItem label={t('Kind')} obj={resource} path="kind">
        {resource.kind}
      </DetailsItem>
      <DetailsItem label={t('Name')} obj={resource} path="metadata.name">
        <ResourceLink
          groupVersionKind={resourceGroupVersionKind}
          name={getName(resource)}
          namespace={resourceNamespace}
        />
      </DetailsItem>
      {resourceNamespace && (
        <DetailsItem label={t('Namespace')} obj={resource} path="metadata.namespace">
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={resourceNamespace}
            namespace={null}
            title={getUID(resource)}
          />
        </DetailsItem>
      )}
      {status && (
        <DetailsItem label={t('Status')} obj={resource}>
          {status}
        </DetailsItem>
      )}
      {resourceDetails.map(([label, value]) =>
        value === undefined || value === '' ? null : (
          <DetailsItem key={label} label={label} obj={resource}>
            {String(value)}
          </DetailsItem>
        ),
      )}
      <DetailsItem
        canEdit={false}
        label={t('Labels')}
        obj={resource}
        path="metadata.labels"
        valueClassName="co-editable-label-group"
      >
        <LabelList groupVersionKind={resourceGroupVersionKind} labels={getLabels(resource)} />
      </DetailsItem>
      <DetailsItem label={t('Annotations')} obj={resource} path="metadata.annotations">
        {t('{{count}} annotation', { count: Object.keys(getAnnotations(resource, {})).length })}
      </DetailsItem>
      <DetailsItem label={t('Description')} obj={resource} path="metadata.annotations.description">
        <DescriptionDetails obj={resource} />
      </DetailsItem>
      <DetailsItem label={t('Created at')} obj={resource} path="metadata.creationTimestamp">
        <Timestamp timestamp={getCreationTimestamp(resource)} />
      </DetailsItem>
      <DetailsItem label={t('Owner')} obj={resource} path="metadata.ownerReferences">
        <OwnerReferences resource={resource} />
      </DetailsItem>
    </DescriptionList>
  );
};

export default DetailsTab;
