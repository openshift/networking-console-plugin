import { Selector } from '@openshift-console/dynamic-plugin-sdk';
import { DEFAULT_NAMESPACE } from '@utils/constants';
import { PROJECT_NAME_LABEL_KEY } from '@utils/resources/udns/constants';
import { isEmpty } from '@utils/utils';
import { ProjectMappingOption } from '@views/vmnetworks/form/constants';

export const getDefaultProjectMappingOption = (
  namespaceSelector: Selector,
): ProjectMappingOption => {
  if (!isEmpty(namespaceSelector?.matchExpressions)) {
    return ProjectMappingOption.SelectFromList;
  }
  if (namespaceSelector?.matchLabels?.[PROJECT_NAME_LABEL_KEY] === DEFAULT_NAMESPACE) {
    return ProjectMappingOption.AllProjects;
  }
  return ProjectMappingOption.SelectByLabels;
};
