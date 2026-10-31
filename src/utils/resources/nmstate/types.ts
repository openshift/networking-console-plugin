import { OVNBridgeMapping } from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

export type NodeNetworkStateKind = K8sResourceKind & {
  status?: { currentState?: { ovn?: { 'bridge-mappings'?: OVNBridgeMapping[] } } };
};

export type ObservedBridgeMapping = { bridge: string; localnet: string; nodeName: string };
