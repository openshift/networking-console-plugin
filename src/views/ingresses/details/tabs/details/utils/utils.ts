import { IoK8sApiNetworkingV1IngressServiceBackend } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';

export const getPort = (service: IoK8sApiNetworkingV1IngressServiceBackend): number | string =>
  service?.port?.number || service?.port?.name;
