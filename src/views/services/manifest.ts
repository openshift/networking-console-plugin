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

const ServiceExtensionModel = {
  group: 'core',
  kind: 'Service',
  version: 'v1',
};

export const ServicesExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'ServiceList' },
      model: ServiceExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-nads',
        'data-test-id': 'nads-nav-item',
      },
      id: 'services',
      model: ServiceExtensionModel,
      name: '%plugin__networking-console-plugin~Services%',
      section: 'networking',
    },
    type: 'console.navigation/resource-ns',
  } as EncodedExtension<ResourceNSNavItem>,
  {
    properties: {
      model: ServiceExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.ServiceYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  {
    properties: {
      component: { $codeRef: 'ServiceDetails' },
      model: ServiceExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
];

export const ServicesExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  ServiceDetails: './views/services/details/ServiceDetailsPage.tsx',
  ServiceList: './views/services/list/ServiceList.tsx',
};
