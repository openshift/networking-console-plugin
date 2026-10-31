import { getConfigAsJSON, getType } from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName, getNamespace } from '@utils/resources/shared';
import { NetworkTypeKeys, ovnK8sTopologyKeys } from '@views/nads/form/utils/types';

import { LocalnetNAD } from './types';

export const isLocalnetNAD = (nad: NetworkAttachmentDefinitionKind): boolean => {
  const config = getConfigAsJSON(nad);

  return (
    getType(config) === NetworkTypeKeys.ovnKubernetesNetworkType &&
    config?.topology === ovnK8sTopologyKeys.ovnK8sLocalnet
  );
};

export const getLocalnetNAD = (
  nad: NetworkAttachmentDefinitionKind,
): LocalnetNAD | undefined => {
  if (!isLocalnetNAD(nad)) return undefined;

  const config = getConfigAsJSON(nad);
  const physicalNetworkName = (config?.physicalNetworkName || config?.name || '').trim();

  if (!physicalNetworkName) return undefined;

  return {
    mtu: config?.mtu != null ? String(config.mtu) : '',
    nad,
    name: getName(nad),
    namespace: getNamespace(nad),
    physicalNetworkName,
    vlan: config?.vlanID != null ? String(config.vlanID) : '',
  };
};

export const getLocalnetNADs = (nads: NetworkAttachmentDefinitionKind[]): LocalnetNAD[] =>
  (nads || []).reduce((acc, nad) => {
    const localnetNAD = getLocalnetNAD(nad);
    return localnetNAD ? [...acc, localnetNAD] : acc;
  }, [] as LocalnetNAD[]);
