import { OVNBridgeMapping } from '@kubevirt-ui-ext/kubevirt-api/nmstate';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

export type NodeNetworkStateKind = {
  status?: { currentState?: { ovn?: { 'bridge-mappings'?: OVNBridgeMapping[] } } };
} & K8sResourceKind;

export type ObservedBridgeMapping = { bridge: string; localnet: string; nodeName: string };
