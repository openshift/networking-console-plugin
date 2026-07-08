import {
  ResourceActionProvider,
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
  {
    properties: {
      component: { $codeRef: 'NADDetailsPage' },
      model: NetworkAttachmentDefinitionExtensionModel,
    },
    type: 'console.page/resource/details',
  } as EncodedExtension<ResourceDetailsPage>,
];

export const NADsExposedModules: ConsolePluginBuildMetadata['exposedModules'] = {
  NADDetailsPage: './views/nads/details/NADDetailsPage.tsx',
  NetworkAttachmentDefinitionFormPage: './views/nads/form/NetworkAttachmentDefinitionFormPage.tsx',
  NetworkAttachmentDefinitionList: './views/nads/list/NetworkAttachmentDefinitionList.tsx',
  useNADsActions: './views/nads/actions/hooks/useNADsActions.tsx',
};
