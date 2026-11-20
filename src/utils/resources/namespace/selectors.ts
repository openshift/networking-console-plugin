import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { getAnnotations } from '@utils/resources/shared';

import {
  PROJECT_ALLOW_POD_NETWORK_ANNOTATION,
  PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
  PROJECT_DEFAULT_NETWORK_ANNOTATION,
} from './constants';

export type ProjectNetworkSettings = {
  defaultNadName?: string;
  isPodNetworkAllowed: boolean;
};

const getProjectDefaultNadName = (namespace?: K8sResourceCommon): string | undefined =>
  getAnnotations(namespace)?.[PROJECT_DEFAULT_NETWORK_ANNOTATION];

const isPodNetworkAllowed = (namespace?: K8sResourceCommon): boolean => {
  const value = getAnnotations(namespace)?.[PROJECT_ALLOW_POD_NETWORK_ANNOTATION];
  return value !== PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE;
};

export const getProjectNetworkSettings = (
  namespace?: K8sResourceCommon,
): ProjectNetworkSettings => ({
  defaultNadName: getProjectDefaultNadName(namespace),
  isPodNetworkAllowed: isPodNetworkAllowed(namespace),
});
