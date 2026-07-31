import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { K8sResourceCommon, K8sResourceCondition } from '@openshift-console/dynamic-plugin-sdk';

type EndpointSliceEndpoint = {
  addresses?: string[];
  conditions?: {
    ready?: boolean;
    serving?: boolean;
    terminating?: boolean;
  };
  targetRef?: {
    kind?: string;
    name?: string;
    namespace?: string;
    uid?: string;
  };
};

export type EndpointSliceKind = {
  endpoints?: EndpointSliceEndpoint[];
} & K8sResourceCommon;

export enum EndpointHealthStatus {
  Degraded = 'Degraded',
  Down = 'Down',
  Healthy = 'Healthy',
  Unknown = 'Unknown',
}

export type ServiceEndpointHealth = {
  ready: number;
  status: EndpointHealthStatus;
  total: number;
};

export type ServiceWithHealth = {
  _health?: ServiceEndpointHealth;
} & IoK8sApiCoreV1Service;

export type RouteTarget = {
  kind: 'Service';
  name: string;
  weight?: number;
};

export type RouteTLS = {
  caCertificate?: string;
  certificate?: string;
  destinationCACertificate?: string;
  insecureEdgeTerminationPolicy?: string;
  key?: string;
  termination: string;
};

export type RouteIngress = {
  conditions: K8sResourceCondition[];
  host?: string;
  routerCanonicalHostname?: string;
  routerName?: string;
  wildcardPolicy?: string;
};

export type RouteKind = {
  spec: {
    alternateBackends?: RouteTarget[];
    host?: string;
    path?: string;
    port?: {
      targetPort: number | string;
    };
    subdomain?: string;
    tls?: RouteTLS;
    to: RouteTarget;
    wildcardPolicy?: string;
  };
  status?: {
    conditions?: K8sResourceCondition[];
    ingress: RouteIngress[];
    url?: string;
  };
} & K8sResourceCommon;

export type RouteWithHealth = {
  _backendHealth?: ServiceEndpointHealth;
} & RouteKind;
