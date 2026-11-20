import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';

export type WorkloadAttachment = {
  binding?: string;
  interfaceName: string;
  nad?: NetworkAttachmentDefinitionKind;
  reference: string;
};

export type WorkerBridgeAttachment = {
  bridge: string;
  nodeName: string;
};
