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

const RouteExtensionModel = {
  group: 'route.openshift.io',
  kind: 'Route',
  version: 'v1',
};

export const RoutesExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'RoutesList' },
      model: RouteExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-nads',
        'data-test-id': 'nads-nav-item',
      },
      id: 'routes',
      model: RouteExtensionModel,
      name: '%plugin__networking-console-plugin~Routes%',
      section: 'networking',
    },
    type: 'console.navigation/resource-ns',
  } as EncodedExtension<ResourceNSNavItem>,
  {
    properties: {
      model: RouteExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.RouteYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  {
    properties: {
      component: { $codeRef: 'RouteDetails' },
      model: RouteExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
  {
    properties: {
      component: {
        $codeRef: 'RouteFormPage',
      },
      exact: true,
      path: [
        `/k8s/ns/:ns/${RouteExtensionModel.group}~${RouteExtensionModel.version}~${RouteExtensionModel.kind}/~new/form`,
      ],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      component: {
        $codeRef: 'EditRoute',
      },
      exact: true,
      path: ['/k8s/ns/:namespace/route.openshift.io~v1~Route/:name/form'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
];

export const RoutesExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  EditRoute: './views/routes/details/EditRoute.tsx',
  RouteDetails: './views/routes/details/RouteDetailsPage.tsx',
  RouteFormPage: './views/routes/form/RouteFormPage.tsx',
  RoutesList: './views/routes/list/RoutesList.tsx',
};
