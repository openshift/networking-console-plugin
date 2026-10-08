/**
 * Derived type aliases for Kubernetes resources from @openshift/api-types.
 *
 * Top-level resource types are re-exported directly from the barrel.
 * Sub-resource types are derived using indexed access + NonNullable
 * so we never depend on opaque numbered interface names.
 */

// ---------------------------------------------------------------------------
// Top-level resource kinds (from the barrel export)
// ---------------------------------------------------------------------------

export type {
  CoreV1PodKind as Pod,
  CoreV1ServiceKind as Service,
  NetworkingK8SIoV1IngressKind as Ingress,
  NetworkingK8SIoV1NetworkPolicyKind as NetworkPolicy,
} from '@openshift/api-types/dist/kubernetes/all';

import type {
  CoreV1PodKind,
  NetworkingK8SIoV1IngressKind,
  NetworkingK8SIoV1NetworkPolicyKind,
} from '@openshift/api-types/dist/kubernetes/all';

// ---------------------------------------------------------------------------
// Networking — Ingress derived types
// ---------------------------------------------------------------------------

export type IngressSpec = NonNullable<NetworkingK8SIoV1IngressKind['spec']>;
export type IngressRule = NonNullable<IngressSpec['rules']>[number];
export type IngressServiceBackend = NonNullable<
  NonNullable<IngressSpec['defaultBackend']>['service']
>;

// ---------------------------------------------------------------------------
// Networking — NetworkPolicy derived types
// ---------------------------------------------------------------------------

export type NetworkPolicySpec = NonNullable<NetworkingK8SIoV1NetworkPolicyKind['spec']>;
export type NetworkPolicyIngressRule = NonNullable<NetworkPolicySpec['ingress']>[number];
export type NetworkPolicyPort = NonNullable<NetworkPolicyIngressRule['ports']>[number];

// ---------------------------------------------------------------------------
// Core — Pod derived types
// ---------------------------------------------------------------------------

export type Container = NonNullable<CoreV1PodKind['spec']>['containers'][number];
export type ContainerStatus = NonNullable<
  NonNullable<CoreV1PodKind['status']>['containerStatuses']
>[number];
