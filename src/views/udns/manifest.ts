import {
  DetailsItem,
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
      column: 'right',
      component: { $codeRef: 'UserDefinedNetworkTopologyDetails' },
      id: 'cudn-topology-detail-item',
      model: ClusterUserDefinedNetworkExtensionModel,
      path: 'spec.network.topology',
      title: 'Topology',
    },
    type: 'console.resource/details-item',
  } as EncodedExtension<DetailsItem>,
  {
    properties: {
      column: 'right',
      component: { $codeRef: 'UserDefinedNetworkLayerDetails' },
      id: 'cudn-layer-detail-item',
      model: ClusterUserDefinedNetworkExtensionModel,
      title: '',
    },
    type: 'console.resource/details-item',
  } as EncodedExtension<DetailsItem>,
  {
    properties: {
      column: 'right',
      component: { $codeRef: 'UserDefinedNetworkTopologyDetails' },
      id: 'udn-topology-detail-item',
      model: UserDefinedNetworkExtensionModel,
      path: 'spec.topology',
      title: 'Topology',
    },
    type: 'console.resource/details-item',
  } as EncodedExtension<DetailsItem>,
  {
    properties: {
      column: 'right',
      component: { $codeRef: 'UserDefinedNetworkLayerDetails' },
      id: 'udn-layer-detail-item',
      model: UserDefinedNetworkExtensionModel,
      title: '',
    },
    type: 'console.resource/details-item',
  } as EncodedExtension<DetailsItem>,
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
  UserDefinedNetworkFormPage: './views/udns/form/UserDefinedNetworkFormPage.tsx',
  UserDefinedNetworkLayerDetails: './views/udns/details/tabs/details/UDNLayerDetails.tsx',
  UserDefinedNetworksList: './views/udns/list/UserDefinedNetworksList.tsx',
  UserDefinedNetworkTopologyDetails: './views/udns/details/tabs/details/UDNTopologyDetails.tsx',
};
