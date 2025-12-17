import { ClusterUserDefinedNetworkSpec } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

export const isValidProjectMapping = (
  showProjectList: boolean,
  matchLabelCheck: boolean,
  namespaceSelector: ClusterUserDefinedNetworkSpec['namespaceSelector'],
): boolean => {
  if (showProjectList) {
    return (
      !isEmpty(namespaceSelector?.matchExpressions) &&
      namespaceSelector?.matchExpressions?.some((expr) => !isEmpty(expr?.values))
    );
  }

  return matchLabelCheck || !isEmpty(namespaceSelector?.matchLabels);
};
