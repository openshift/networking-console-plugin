import { ALL_NAMESPACES } from '@utils/constants';
import { getReferenceForModel, NetworkPolicyModel } from '@utils/models';
import { MultiNetworkPolicyModel } from '@utils/models';

import { TAB_INDEXES } from './constants';

export const getActiveKeyFromPathname = (pathname: string) => {
  if (pathname.endsWith(MultiNetworkPolicyModel.kind)) return TAB_INDEXES.MULTI_NETWORK;

  if (pathname.includes('enable-multi')) return TAB_INDEXES.ENABLE_MULTI;

  return TAB_INDEXES.NETWORK;
};

export const getNetworkPolicyURLTab = (tabIndex: number | string, namespace: string): string => {
  const namespacePath = namespace === ALL_NAMESPACES ? namespace : `ns/${namespace}`;

  if (tabIndex === TAB_INDEXES.ENABLE_MULTI) {
    return `/k8s/${namespacePath}/${getReferenceForModel(NetworkPolicyModel)}/enable-multi`;
  }

  return `/k8s/${namespacePath}/${tabIndex === TAB_INDEXES.NETWORK ? getReferenceForModel(NetworkPolicyModel) : getReferenceForModel(MultiNetworkPolicyModel)}`;
};
