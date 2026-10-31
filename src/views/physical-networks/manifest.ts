import { HrefNavItem, RoutePage } from '@openshift-console/dynamic-plugin-sdk';
import type {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

export const PhysicalNetworksExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  PhysicalNetworksPage: './views/physical-networks/PhysicalNetworksPage.tsx',
};

export const PhysicalNetworksExtensions: EncodedExtension[] = [
  {
    properties: {
      component: {
        $codeRef: 'PhysicalNetworksPage',
      },
      path: ['/physical-networks'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-physical-networks',
        'data-test-id': 'physical-networks-nav-item',
      },
      href: '/physical-networks',
      id: 'physical-networks',
      insertBefore: 'networkPolicies',
      name: '%plugin__networking-console-plugin~Physical networks%',
      prefixNamespaced: false,
      section: 'networking',
    },
    type: 'console.navigation/href',
  } as EncodedExtension<HrefNavItem>,
  {
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-physical-networks-virt-perspective',
        'data-test-id': 'physical-networks-virt-perspective-nav-item',
      },
      href: '/physical-networks',
      id: 'physical-networks-virt-perspective',
      insertBefore: 'networkpolicies-virt-perspective',
      name: '%plugin__networking-console-plugin~Physical networks%',
      perspective: 'virtualization-perspective',
      prefixNamespaced: false,
      section: 'networking-virt-perspective',
    },
    type: 'console.navigation/href',
  } as EncodedExtension<HrefNavItem>,
];
