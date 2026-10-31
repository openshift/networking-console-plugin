import type {
  IoK8sApiCoreV1Node,
  IoK8sApiCoreV1Pod,
} from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import type { V1VirtualMachine } from '@kubevirt-ui-ext/kubevirt-api/kubevirt';
import {
  V1beta1NodeNetworkConfigurationEnactment,
  V1NodeNetworkConfigurationPolicy,
} from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import type { K8sGroupVersionKind } from '@openshift-console/dynamic-plugin-sdk';
import type { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import type { NodeNetworkStateKind } from '@utils/resources/nmstate/types';

export enum SourceAvailability {
  Absent = 'absent',
  Available = 'available',
  Error = 'error',
  Forbidden = 'forbidden',
  Loading = 'loading',
}

export type SourceState<T> = { availability: SourceAvailability; data: T[] };

export type ConsumersAvailability = 'complete' | 'partial' | 'unavailable';

export enum EnactmentState {
  // t('Aborted')
  Aborted = 'Aborted',
  // t('Available')
  Available = 'Available',
  // t('Failing')
  Failing = 'Failing',
  // t('Pending')
  Pending = 'Pending',
  // t('Progressing')
  Progressing = 'Progressing',
}

export type NodeEnactmentStateDetails = { node: IoK8sApiCoreV1Node; status: string };
export type NodeToEnactmentStateMap = Record<string, NodeEnactmentStateDetails>;
export type NNCPToNodeEnactmentStateMap = Record<string, NodeToEnactmentStateMap>;

export type ConfigurationDetails = {
  aggregationMode: string;
  configurationName: string;
  description: string;
  enactmentState: EnactmentState;
  mtu: number;
  nncp: V1NodeNetworkConfigurationPolicy;
  nodes: IoK8sApiCoreV1Node[];
  nodeToEnactmentStateMap: NodeToEnactmentStateMap;
  numNodes: number;
  physicalNetworkName: string;
  uplink: string;
};
export type ConfigurationDetailsMap = Record<string, ConfigurationDetails>;

export type LocalnetNAD = {
  mtu: string;
  nad: NetworkAttachmentDefinitionKind;
  name: string;
  namespace: string;
  physicalNetworkName: string;
  vlan: string;
};

export type PhysicalNetworkConsumer = {
  groupVersionKind: K8sGroupVersionKind;
  kind: 'Pod' | 'VirtualMachine';
  name: string;
  namespace: string;
  url: string;
};

export type ObservedMapping = { bridge: string; node?: IoK8sApiCoreV1Node; nodeName: string };

export type PhysicalNetwork = {
  consumersByNAD: Record<string, PhysicalNetworkConsumer[]>; // key `${namespace}/${name}`
  nads: LocalnetNAD[];
  name: string;
  nncpDetails: ConfigurationDetails[];
  observedMappings: ObservedMapping[];
  selectedNodes: IoK8sApiCoreV1Node[];
};

export type PhysicalNetworksSources = {
  nads: SourceState<NetworkAttachmentDefinitionKind>;
  nnces: SourceState<V1beta1NodeNetworkConfigurationEnactment>;
  nncps: SourceState<V1NodeNetworkConfigurationPolicy>;
  nodeNetworkStates: SourceState<NodeNetworkStateKind>;
  nodes: SourceState<IoK8sApiCoreV1Node>;
  pods: SourceState<IoK8sApiCoreV1Pod>;
  virtualMachines: SourceState<V1VirtualMachine>;
};
