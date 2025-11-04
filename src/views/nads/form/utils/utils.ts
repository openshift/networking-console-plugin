import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import {
  IPAMConfig,
  NetworkAttachmentDefinitionAnnotations,
  NetworkAttachmentDefinitionConfig,
  NetworkAttachmentDefinitionKind,
  RESOURCE_NAME_ANNOTATION,
} from '@utils/resources/nads/types';
import { getName } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';
import { networkConsole } from '@utils/utils';

import { DEFAULT_MTU } from './constants';
import { NetworkAttachmentDefinitionFormInput, NetworkTypeKeys, ovnK8sTopologyKeys } from './types';

const buildConfig = (
  formData: NetworkAttachmentDefinitionFormInput,
  namespace: string,
): NetworkAttachmentDefinitionConfig => {
  const { name, networkType } = formData;
  const networkTypeData = formData?.[networkType];

  const commonConfig: Partial<NetworkAttachmentDefinitionConfig> = {
    cniVersion: '0.3.1',
    name,
    type: networkType,
  };

  const ipam = safeParser<IPAMConfig>(networkTypeData?.ipam);
  const netAttachDefName = `${namespace}/${name}`;
  const subnets = networkTypeData?.subnets ?? undefined;

  const specificConfig: Record<NetworkTypeKeys, Partial<NetworkAttachmentDefinitionConfig>> = {
    [NetworkTypeKeys.cnvBridgeNetworkType]: {
      bridge: networkTypeData?.bridge,
      ipam,
      macspoofchk: networkTypeData?.macspoofchk,
      preserveDefaultVlan: false,
      vlan: parseInt(networkTypeData?.vlanTagNum, 10) || undefined,
    },
    [NetworkTypeKeys.ovnKubernetesNetworkType]: {
      netAttachDefName,
      subnets,
      topology: ovnK8sTopologyKeys.ovnK8sLayer,
    },
    [NetworkTypeKeys.ovnKubernetesSecondaryLocalnet]: {
      cniVersion: '0.4.0',
      excludeSubnets: networkTypeData?.excludeSubnets ?? undefined,
      mtu: parseInt(networkTypeData?.mtu, 10) || DEFAULT_MTU,
      name: networkTypeData?.bridgeMapping,
      netAttachDefName,
      subnets,
      topology: ovnK8sTopologyKeys.ovnK8sLocalnet,
      type: NetworkTypeKeys.ovnKubernetesNetworkType,
      vlanID: parseInt(networkTypeData?.vlanID, 10) || undefined,
    },
    [NetworkTypeKeys.sriovNetworkType]: {
      ipam,
    },
  };

  return { ...commonConfig, ...specificConfig[networkType] };
};

const safeParser = <T extends object>(ipamString: string | undefined): T => {
  try {
    return JSON.parse(ipamString || '{}');
  } catch (e) {
    networkConsole.error('Could not parse IP address management JSON', e);
    return {} as T;
  }
};

const getResourceName = (
  formData: NetworkAttachmentDefinitionFormInput,
  networkType: string,
): string => {
  const paramsData = formData?.[networkType];

  if (isEmpty(paramsData)) return null;

  if (networkType === NetworkTypeKeys.cnvBridgeNetworkType)
    return `bridge.network.kubevirt.io/${paramsData?.bridge}`;

  return !isEmpty(paramsData?.resourceName) ? `openshift.io/${paramsData?.resourceName}` : null;
};

export const fromNADObjToFormData = (
  nadObj: NetworkAttachmentDefinitionKind,
): NetworkAttachmentDefinitionFormInput => {
  const configParsed = safeParser<NetworkAttachmentDefinitionConfig>(nadObj.spec.config);

  const ipam = JSON.stringify(configParsed?.ipam);

  return {
    description: nadObj?.metadata?.annotations?.description,
    name: getName(nadObj),
    networkType: getLocalnetTopologyType(configParsed.type, configParsed?.topology),
    [NetworkTypeKeys.cnvBridgeNetworkType]: {
      bridge: configParsed?.bridge || null,
      macspoofchk: configParsed?.macspoofchk,
      vlanTagNum: configParsed?.vlan?.toString() || '',
    },
    [NetworkTypeKeys.ovnKubernetesNetworkType]: {
      subnets: configParsed?.subnets,
    },
    [NetworkTypeKeys.ovnKubernetesSecondaryLocalnet]: {
      bridgeMapping: configParsed?.name,
      excludeSubnets: configParsed?.excludeSubnets,
      mtu: (configParsed?.mtu || DEFAULT_MTU)?.toString(),
      subnets: configParsed?.subnets,
      vlanID: configParsed.vlanID?.toString() || '',
    },
    [NetworkTypeKeys.sriovNetworkType]: {
      ipam,
      resourceName: nadObj?.metadata?.annotations?.[RESOURCE_NAME_ANNOTATION],
      vlanTagNum: configParsed?.vlan?.toString() || '',
    },
  };
};

export const fromDataToNADObj = (
  formData: NetworkAttachmentDefinitionFormInput,
  namespace: string,
): NetworkAttachmentDefinitionKind => {
  const { description, name, networkType } = formData;
  const config = JSON.stringify(buildConfig(formData, namespace), null, 4);
  const resourceName = getResourceName(formData, networkType);
  const annotations: NetworkAttachmentDefinitionAnnotations = {
    ...(!isEmpty(resourceName) && { [RESOURCE_NAME_ANNOTATION]: resourceName }),
    ...(!isEmpty(description) && { description: description }),
  };

  return {
    apiVersion: `${NetworkAttachmentDefinitionModel.apiGroup}/${NetworkAttachmentDefinitionModel.apiVersion}`,
    kind: NetworkAttachmentDefinitionModel.kind,
    metadata: {
      annotations,
      name,
      namespace,
    },
    spec: {
      config,
    },
  };
};

export const createNetAttachDef = (
  formData: NetworkAttachmentDefinitionFormInput,
  namespace: string,
) =>
  k8sCreate({
    data: fromDataToNADObj(formData, namespace),
    model: NetworkAttachmentDefinitionModel,
  });

export const getLocalnetTopologyType = (networkType: string, networkTopology?: string): string =>
  networkType === NetworkTypeKeys.ovnKubernetesNetworkType &&
  networkTopology === ovnK8sTopologyKeys.ovnK8sLocalnet
    ? NetworkTypeKeys.ovnKubernetesSecondaryLocalnet
    : networkType;
