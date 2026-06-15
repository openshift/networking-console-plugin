import { modelToRef, NetworkPolicyModel } from '@kubevirt-ui/kubevirt-api/console';
import { MultiNetworkPolicyModel } from '@utils/models';
import { createNamespacePath } from '@utils/utils/helpers';

import { TAB_INDEXES } from './constants';

export const getActiveKeyFromPathname = (pathname: string) => {
  if (pathname.endsWith(MultiNetworkPolicyModel.kind)) return TAB_INDEXES.MULTI_NETWORK;

  if (pathname.includes('enable-multi')) return TAB_INDEXES.ENABLE_MULTI;

  return TAB_INDEXES.NETWORK;
};

export const getNetworkPolicyURLTab = (tabIndex: number | string, namespace: string): string => {
  const namespacePath = createNamespacePath(namespace);

  if (tabIndex === TAB_INDEXES.ENABLE_MULTI) {
    return `/k8s/${namespacePath}/${modelToRef(NetworkPolicyModel)}/enable-multi`;
  }

  return `/k8s/${namespacePath}/${tabIndex === TAB_INDEXES.NETWORK ? modelToRef(NetworkPolicyModel) : modelToRef(MultiNetworkPolicyModel)}`;
};
