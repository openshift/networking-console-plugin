import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack';
import { HrefNavItem, RoutePage } from '@openshift-console/dynamic-plugin-sdk';
import { ConsolePluginBuildMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack/lib/build-types';

import { VM_NETWORKS_PATH } from './constants';

export const VMNetworksExtensions: EncodedExtension[] = [
  {
    flags: {
      required: ['CAN_LIST_NS', 'NMSTATE_PLUGIN_ENABLED'],
    },
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-vmnetwork',
        'data-test-id': 'vmnetwork-nav-item',
      },
      href: 'k8s/cluster/virtualmachine-networks',
      id: 'vmnetwork-virt-perspective',
      insertBefore: 'networkpolicies-virt-perspective',
      name: '%plugin__networking-console-plugin~VirtualMachine networks%',
      perspective: 'virtualization-perspective',
      prefixNamespaced: false,
      section: 'networking-virt-perspective',
    },
    type: 'console.navigation/href',
  } as EncodedExtension<HrefNavItem>,
  {
    flags: {
      required: ['CAN_LIST_NS', 'NMSTATE_PLUGIN_ENABLED'],
    },
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-vmnetwork',
        'data-test-id': 'vmnetwork-nav-item',
      },
      href: 'k8s/cluster/virtualmachine-networks',
      id: 'vmnetwork',
      insertBefore: 'networkPolicies',
      name: '%plugin__networking-console-plugin~VirtualMachine networks%',
      prefixNamespaced: false,
      section: 'networking',
    },
    type: 'console.navigation/href',
  } as EncodedExtension<HrefNavItem>,
  {
    properties: {
      component: {
        $codeRef: 'VMNetworkList',
      },
      path: [VM_NETWORKS_PATH],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      component: {
        $codeRef: 'VMNetworkPage',
      },
      path: [`${VM_NETWORKS_PATH}/:name`],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      component: {
        $codeRef: 'VMNetworkNewForm',
      },
      path: [`${VM_NETWORKS_PATH}/~new`],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
];

export const VMNetworksExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  VMNetworkList: './views/vmnetworks/list/VMNetworkList.tsx',
  VMNetworkNewForm: './views/vmnetworks/form/VMNetworkNewForm.tsx',
  VMNetworkPage: './views/vmnetworks/details/VMNetworkPage.tsx',
};
