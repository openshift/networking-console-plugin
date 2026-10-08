import { NetworkAttachmentDefinitionModel } from '@utils/models';

export const NetworkAttachmentDefinitionsYAMLTemplates = `
apiVersion: ${NetworkAttachmentDefinitionModel.apiGroup}/${NetworkAttachmentDefinitionModel.apiVersion}
kind: ${NetworkAttachmentDefinitionModel.kind}
metadata:
  name: example
spec:
  config: '{}'
`;
