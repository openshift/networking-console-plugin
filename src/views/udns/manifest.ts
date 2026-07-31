import {
  ResourceDetailsPage,
  ResourceListPage,
  ResourceNSNavItem,
  RoutePage,
  YAMLTemplate,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

import { FLAG_UDN_ENABLED } from '../../utils/flags/consts';

const ClusterUserDefinedNetworkExtensionModel = {
  group: 'k8s.ovn.org',
  kind: 'ClusterUserDefinedNetwork',
  version: 'v1',
};

const UserDefinedNetworkExtensionModel = {
  group: 'k8s.ovn.org',
  kind: 'UserDefinedNetwork',
  version: 'v1',
};

export const UserDefinedNetworksExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'UserDefinedNetworksList' },
      model: ClusterUserDefinedNetworkExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    properties: {
      component: { $codeRef: 'UserDefinedNetworksList' },
      model: UserDefinedNetworkExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    flags: {
      required: [FLAG_UDN_ENABLED],
    },
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-udns',
        'data-test-id': 'udns-nav-item',
      },
      id: 'udns',
      model: UserDefinedNetworkExtensionModel,
      name: '%plugin__networking-console-plugin~UserDefinedNetworks%',
      section: 'networking',
    },
    type: 'console.navigation/resource-ns',
  } as EncodedExtension<ResourceNSNavItem>,
  {
    properties: {
      model: ClusterUserDefinedNetworkExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.ClusterUserDefinedNetworksYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  {
    properties: {
      model: UserDefinedNetworkExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.UserDefinedNetworksYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  {
    properties: {
      component: { $codeRef: 'UDNDetailsPage' },
      model: ClusterUserDefinedNetworkExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
  {
    properties: {
      component: { $codeRef: 'UDNDetailsPage' },
      model: UserDefinedNetworkExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
  {
    properties: {
      component: {
        $codeRef: 'UserDefinedNetworkFormPage',
      },
      exact: true,
      path: [
        `/k8s/cluster/${ClusterUserDefinedNetworkExtensionModel.group}~${ClusterUserDefinedNetworkExtensionModel.version}~${ClusterUserDefinedNetworkExtensionModel.kind}/~new/form`,
      ],
      perspective: 'admin',
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      component: {
        $codeRef: 'UserDefinedNetworkFormPage',
      },
      exact: true,
      path: [
        `/k8s/ns/:ns/${UserDefinedNetworkExtensionModel.group}~${UserDefinedNetworkExtensionModel.version}~${UserDefinedNetworkExtensionModel.kind}/~new/form`,
      ],
      perspective: 'admin',
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
];

export const UserDefinedNetworksExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  UDNDetailsPage: './views/udns/details/UDNDetailsPage.tsx',
  UserDefinedNetworkFormPage: './views/udns/form/UserDefinedNetworkFormPage.tsx',
  UserDefinedNetworksList: './views/udns/list/UserDefinedNetworksList.tsx',
};
