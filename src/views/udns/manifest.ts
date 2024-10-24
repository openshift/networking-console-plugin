import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack';
import {
  ResourceListPage,
  ResourceNSNavItem,
  YAMLTemplate,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsolePluginBuildMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack/lib/build-types';

const UserDefinedNetworkExtensionModel = {
  group: 'k8s.ovn.org',
  kind: 'UserDefinedNetwork',
  version: 'v1',
};

export const UserDefinedNetworksExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'UserDefinedNetworksList' },
      model: UserDefinedNetworkExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
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
      model: UserDefinedNetworkExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.UserDefinedNetworksYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  /*{
    properties: {
      component: { $codeRef: 'UserDefinedNetworkDetails' },
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
        `/k8s/ns/:ns/${UserDefinedNetworkExtensionModel.group}~${UserDefinedNetworkExtensionModel.version}~${UserDefinedNetworkExtensionModel.kind}/~new/form`,
      ],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      component: {
        $codeRef: 'EditUserDefinedNetwork',
      },
      exact: true,
      path: ['/k8s/ns/:namespace/route.openshift.io~v1~UserDefinedNetwork/:name/form'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,*/
];

export const UserDefinedNetworksExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  // EditUserDefinedNetwork: './views/udns/details/EditUserDefinedNetwork.tsx',
  // UserDefinedNetworkDetails: './views/udns/details/UserDefinedNetworkDetailsPage.tsx',
  // UserDefinedNetworkFormPage: './views/udns/form/UserDefinedNetworkFormPage.tsx',
  UserDefinedNetworksList: './views/udns/list/UserDefinedNetworksList.tsx',
};
