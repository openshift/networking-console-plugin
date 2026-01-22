import { ClusterUserDefinedNetworkSpec } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import { ProjectMappingOption } from './form/constants';

export const isValidProjectMapping = (
  projectMappingOption: ProjectMappingOption,
  namespaceSelector: ClusterUserDefinedNetworkSpec['namespaceSelector'],
): boolean => {
  if (projectMappingOption === ProjectMappingOption.AllProjects) {
    return true;
  }
  if (projectMappingOption === ProjectMappingOption.SelectByLabels) {
    return !isEmpty(namespaceSelector?.matchLabels);
  }
  return (
    !isEmpty(namespaceSelector?.matchExpressions) &&
    namespaceSelector?.matchExpressions?.some((expr) => !isEmpty(expr?.values))
  );
};
