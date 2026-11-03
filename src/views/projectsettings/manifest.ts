import {
  ExtensionK8sKindVersionModel,
  HorizontalNavTab,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

import { FLAG_KUBEVIRT } from '../../utils/flags/consts';

const ProjectExtensionModel = {
  group: 'project.openshift.io',
  kind: 'Project',
  version: 'v1',
};

const NamespaceExtensionModel = {
  group: 'core',
  kind: 'Namespace',
  version: 'v1',
};

const creaeExtensionForModel = (
  model: ExtensionK8sKindVersionModel,
): EncodedExtension<HorizontalNavTab> => ({
  flags: {
    required: [FLAG_KUBEVIRT],
  },
  properties: {
    component: { $codeRef: 'ProjectNetworkSettingsTab' },
    model,
    page: {
      href: 'network-settings',
      name: '%plugin__networking-console-plugin~Network Settings%',
    },
  },
  type: 'console.tab/horizontalNav',
});

export const ProjectSettingsExtensions: EncodedExtension[] = [
  creaeExtensionForModel(ProjectExtensionModel),
  creaeExtensionForModel(NamespaceExtensionModel),
];

export const ProjectSettingsExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  ProjectNetworkSettingsTab: './views/projectsettings/ProjectNetworkSettingsTab.tsx',
};
