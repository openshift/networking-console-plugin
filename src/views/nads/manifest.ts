import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack';
import {
  DetailsItem,
  ResourceActionProvider,
  ResourceListPage,
  ResourceNSNavItem,
  RoutePage,
  YAMLTemplate,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsolePluginBuildMetadata } from '@openshift-console/dynamic-plugin-sdk-webpack/lib/build-types';

import { FLAG_KUBEVIRT, FLAG_NET_ATTACH_DEF } from '../../utils/flags/consts';

const NetworkAttachmentDefinitionExtensionModel = {
  group: 'k8s.cni.cncf.io',
  kind: 'NetworkAttachmentDefinition',
  version: 'v1',
};

export const NADsExtensions: EncodedExtension[] = [
  {
    properties: {
      component: { $codeRef: 'NetworkAttachmentDefinitionList' },
      model: NetworkAttachmentDefinitionExtensionModel,
    },
    type: 'console.page/resource/list',
  } as EncodedExtension<ResourceListPage>,
  {
    flags: {
      required: [FLAG_NET_ATTACH_DEF, FLAG_KUBEVIRT],
    },
    properties: {
      dataAttributes: {
        'data-quickstart-id': 'qs-nav-nads',
        'data-test-id': 'nads-nav-item',
      },
      id: 'networkattachmentdefinitions',
      model: NetworkAttachmentDefinitionExtensionModel,
      name: '%plugin__networking-console-plugin~NetworkAttachmentDefinitions%',
      section: 'networking',
    },
    type: 'console.navigation/resource-ns',
  } as EncodedExtension<ResourceNSNavItem>,
  {
    properties: {
      component: {
        $codeRef: 'NetworkAttachmentDefinitionFormPage',
      },
      exact: true,
      flags: {
        required: [FLAG_NET_ATTACH_DEF, FLAG_KUBEVIRT],
      },
      path: [
        `/k8s/ns/:ns/${NetworkAttachmentDefinitionExtensionModel.group}~${NetworkAttachmentDefinitionExtensionModel.version}~${NetworkAttachmentDefinitionExtensionModel.kind}/~new/form`,
      ],
    },
    type: 'console.page/route',
  } as EncodedExtension<RoutePage>,
  {
    properties: {
      column: 'left',
      component: { $codeRef: 'NetworkAttachmentDefintionDescriptionDetails' },
      id: 'nad-description-detail-item',
      model: NetworkAttachmentDefinitionExtensionModel,
      path: 'metadata.annotations.description',
      title: 'Description',
    },
    type: 'console.resource/details-item',
  } as EncodedExtension<DetailsItem>,
  {
    properties: {
      column: 'right',
      component: { $codeRef: 'NetworkAttachmentDefintionTypeDetails' },
      id: 'nad-type-detail-item',
      model: NetworkAttachmentDefinitionExtensionModel,
      path: 'spec.config.type',
      title: 'Type',
    },
    type: 'console.resource/details-item',
  } as EncodedExtension<DetailsItem>,

  {
    properties: {
      model: NetworkAttachmentDefinitionExtensionModel,
      name: 'default',
      template: {
        $codeRef: 'yamlTemplates.NetworkAttachmentDefinitionsYAMLTemplates',
      },
    },
    type: 'console.yaml-template',
  } as EncodedExtension<YAMLTemplate>,
  {
    properties: {
      model: NetworkAttachmentDefinitionExtensionModel,
      provider: {
        $codeRef: 'useNADsActions',
      },
    },
    type: 'console.action/resource-provider',
  } as EncodedExtension<ResourceActionProvider>,
];

export const NADsExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  NetworkAttachmentDefinitionFormPage: './views/nads/form/NetworkAttachmentDefinitionFormPage.tsx',
  NetworkAttachmentDefinitionList: './views/nads/list/NetworkAttachmentDefinitionList.tsx',
  NetworkAttachmentDefintionDescriptionDetails:
    './views/nads/details/tabs/details/NADDescriptionDetails.tsx',
  NetworkAttachmentDefintionTypeDetails: './views/nads/details/tabs/details/NADTypeDetails.tsx',
  useNADsActions: './views/nads/actions/hooks/useNADsActions.tsx',
};
