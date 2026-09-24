import { HrefNavItem, RoutePage } from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

export const TopologyExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'Topology' },
      exact: true,
      path: [`/k8s/ns/:ns/networking-topology`, '/k8s/all-namespaces/networking-topology'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-configuration-topology',
        'data-test-id': 'configuration-topology-nav-item',
      },
      href: 'networking-topology',
      id: 'network-configuration-topology',
      insertBefore: 'services',
      name: '%plugin__networking-console-plugin~Configuration Topology%',
      perspective: 'admin',
      prefixNamespaced: true,
      section: 'networking',
    },
    type: 'console.navigation/href',
  } as EncodedExtension<HrefNavItem>,
];

export const TopologyExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  Topology: './views/topology/TopologyPage.tsx',
};
