import { IngressServiceBackend } from '@utils/types/k8sTypes';

export const getPort = (service: IngressServiceBackend): number | string =>
  service?.port?.number || service?.port?.name;
