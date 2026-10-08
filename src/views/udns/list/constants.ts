import { getGroupVersionKindForModel, ProjectModel } from '@utils/models';

export const ProjectGroupVersionKind = getGroupVersionKindForModel(ProjectModel);

export const PROJECT_NAME = 'metadata.namespace';
export const PRIMARY_USER_DEFINED_LABEL = 'k8s.ovn.org/primary-user-defined-network';
