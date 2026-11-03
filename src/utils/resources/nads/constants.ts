import { DEFAULT_NAMESPACE } from '@utils/constants';

export const POD_NETWORKS_ANNOTATION_KEY = 'k8s.v1.cni.cncf.io/networks';

export const UDN_LABEL = 'k8s.ovn.org/user-defined-network';
export const OPENSHIFT_MULTUS_NS = 'openshift-multus';
export const OPENSHIFT_SRIOV_NETWORK_OPERATOR_NS = 'openshift-sriov-network-operator';
export const MULTUS_DAEMON_CONFIG_NAME = 'multus-daemon-config';
export const OPENSHIFT_CNV_NS = 'openshift-cnv';
// source:
// https://github.com/openshift/cluster-network-operator/blob/fabe61aba68857f57a0bb585e8b5cc37b7453150/bindata/network/multus/multus.yaml#L105
export const GLOBAL_NAD_NAMESPACES = [
  DEFAULT_NAMESPACE,
  OPENSHIFT_MULTUS_NS,
  OPENSHIFT_SRIOV_NETWORK_OPERATOR_NS,
  OPENSHIFT_CNV_NS,
] as const;

export enum NADRole {
  Primary = 'primary',
  Secondary = 'secondary',
} /** Sentinel value for the Pod network option in the pre-selected network dropdown.
 *  Should be invalid NetworkAttachmentDefinition name.
 */
export const PROJECT_POD_NETWORK_VALUE = '#POD_NETWORK#';
export const PROJECT_DEFAULT_NETWORK_ANNOTATION = 'kubevirt.io/default-network';
export const PROJECT_ALLOW_POD_NETWORK_ANNOTATION = 'kubevirt.io/allow-pod-network';
export const PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE = 'false';
