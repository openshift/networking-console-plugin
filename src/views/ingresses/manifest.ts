import {
  ResourceDetailsPage,
  ResourceListPage,
  ResourceNSNavItem,
  YAMLTemplate,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

const IngressExtensionModel = {
  group: 'networking.k8s.io',
  kind: 'Ingress',
  version: 'v1',
};

export const IngressesExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'IngressList' },
      model: IngressExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-nads',
        'data-test-id': 'nads-nav-item',
      },
      id: 'ingresses',
      model: IngressExtensionModel,
      name: '%plugin__networking-console-plugin~Ingresses%',
      section: 'networking',
    },
    type: 'console.navigation/resource-ns',
  } as EncodedExtension<ResourceNSNavItem>,
  {
    properties: {
      model: IngressExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.IngressYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  {
    properties: {
      component: { $codeRef: 'IngressDetails' },
      model: IngressExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
];

export const IngressesExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  IngressDetails: './views/ingresses/details/IngressDetailsPage.tsx',
  IngressList: './views/ingresses/list/IngressesList.tsx',
};
