import {
  ResourceClusterNavItem,
  ResourceDetailsPage,
  ResourceListPage,
  RoutePage,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsolePluginBuildMetadata,
  EncodedExtension,
} from '@openshift-console/dynamic-plugin-sdk-webpack';

import { FLAG_BGP_ENABLED } from '../../utils/flags/consts';

const BGPCloudConfigurationExtensionModel = {
  group: 'networking.openshift.io',
  kind: 'BGPCloudConfiguration',
  version: 'v1beta1',
};
const BGPRoutingExtensionModel = {
  group: 'networking.openshift.io',
  kind: 'BGPRouting',
  version: 'v1beta1',
};

export const BGPCloudConfigurationExtensions: EncodedExtension[] = [
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPPage' },
      model: BGPCloudConfigurationExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      id: 'bgp-cloud-configurations',
      model: BGPCloudConfigurationExtensionModel,
      name: '%plugin__networking-console-plugin~BGP%',
      section: 'networking',
    },
    type: 'console.navigation/resource-cluster',
  } as EncodedExtension<ResourceClusterNavItem>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPCloudConfigurationDetailsPage' },
      model: BGPCloudConfigurationExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPCloudConfigurationFormPage' },
      exact: true,
      path: ['/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration/~new/form'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPCloudConfigurationFormPage' },
      exact: true,
      path: ['/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration/:name/form'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
];

export const BGPRoutingExtensions: EncodedExtension[] = [
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: { component: { $codeRef: 'BGPPage' }, model: BGPRoutingExtensionModel },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPRoutingDetailsPage' },
      model: BGPRoutingExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPRoutingFormPage' },
      exact: true,
      path: ['/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting/~new/form'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    flags: { required: [FLAG_BGP_ENABLED] },
    properties: {
      component: { $codeRef: 'BGPRoutingFormPage' },
      exact: true,
      path: ['/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting/:name/form'],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
];

export const BGPExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  BGPCloudConfigurationDetailsPage: './views/bgp/details/BGPCloudConfigurationDetailsPage.tsx',
  BGPCloudConfigurationFormPage: './views/bgp/form/BGPCloudConfigurationFormPage.tsx',
  BGPPage: './views/bgp/list/BGPPage.tsx',
  BGPRoutingDetailsPage: './views/bgp/details/BGPRoutingDetailsPage.tsx',
  BGPRoutingFormPage: './views/bgp/form/BGPRoutingFormPage.tsx',
};
