import { NetworkAttachmentDefinitionConfig, NetworkAttachmentDefinitionKind } from '../types';

export const getConfigAsJSON = (
  obj: NetworkAttachmentDefinitionKind,
): NetworkAttachmentDefinitionConfig => {
  try {
    return JSON.parse(obj?.spec?.config);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Unable to parse NetworkAttachmentDefinition configuration');
    return null;
  }
};

export const getType = (config: NetworkAttachmentDefinitionConfig): string => {
  if (config?.type) {
    return config.type;
  }

  if (config?.plugins && Array.isArray(config.plugins) && config.plugins.length > 0) {
    return config.plugins[0]?.type || null;
  }

  return null;
};
