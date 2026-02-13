import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack';
import { ConsolePluginBuildMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack/lib/build-types';

import { FlagsExposedModules, FlagsExtensions } from './src/utils/flags/manifest';
import { IngressesExposedModules, IngressesExtensions } from './src/views/ingresses/manifest';
import { NADsExposedModules, NADsExtensions } from './src/views/nads/manifest';
import {
  NetworkPoliciesExposedModules,
  NetworkPoliciesExtensions,
} from './src/views/networkpolicies/manifest';
import { RoutesExposedModules, RoutesExtensions } from './src/views/routes/manifest';
import { ServicesExposedModules, ServicesExtensions } from './src/views/services/manifest';
import {
  UserDefinedNetworksExposedModules,
  UserDefinedNetworksExtensions,
} from './src/views/udns/manifest';

export const pluginMetadata: ConsolePluginBuildMetadata = {
  dependencies: {
    '@console/pluginAPI': '*',
  },
  description: 'Plugin responsible for all the networking section ui code',
  displayName: 'Networking console plugin',
  exposedModules: {
    ...IngressesExposedModules,
    ...ServicesExposedModules,
    ...NetworkPoliciesExposedModules,
    ...NADsExposedModules,
    ...FlagsExposedModules,
    ...RoutesExposedModules,
    ...UserDefinedNetworksExposedModules,
    yamlTemplates: './templates/index.ts',
  },
  name: 'networking-console-plugin',
  version: '0.0.1',
};

export const extensions: EncodedExtension[] = [
  ...ServicesExtensions,
  ...RoutesExtensions,
  ...IngressesExtensions,
  ...NetworkPoliciesExtensions,
  ...NADsExtensions,
  ...FlagsExtensions,
  ...UserDefinedNetworksExtensions,
];
