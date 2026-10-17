import { NetworkAttachmentDefinitionModel } from '@kubevirt-ui-ext/kubevirt-api/console';

export const NetworkAttachmentDefinitionsYAMLTemplates = `
apiVersion: ${NetworkAttachmentDefinitionModel.apiGroup}/${NetworkAttachmentDefinitionModel.apiVersion}
kind: ${NetworkAttachmentDefinitionModel.kind}
metadata:
  name: example
spec:
  config: '{}'
`;
