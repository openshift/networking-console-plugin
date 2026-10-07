import { modelToGroupVersionKind, ProjectModel } from '@kubevirt-ui-ext/kubevirt-api/console';

export const ProjectGroupVersionKind = modelToGroupVersionKind(ProjectModel);

export const PROJECT_NAME = 'metadata.namespace';
export const PRIMARY_USER_DEFINED_LABEL = 'k8s.ovn.org/primary-user-defined-network';
