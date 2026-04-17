import {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

import { FLAG_UDN_ENABLED } from '../../utils/flags/consts';

export const CreateProjectModalExtensions: EncodedExtension[] = [
  {
    flags: {
      required: [FLAG_UDN_ENABLED],
    },
    properties: {
      component: { $codeRef: 'CreateProjectModal' },
    },
    type: 'console.create-project-modal',
  },
];

export const CreateProjectModalExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  CreateProjectModal: './views/createprojectmodal/CreateProjectModal.tsx',
};
