import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { getSegmentAnalytics } from '@openshift-console/dynamic-plugin-sdk-internal';
import { isEmpty } from '@utils/utils';
import { networkConsole } from '@utils/utils/helpers';
import { DEFAULT_MTU, ProjectMappingOption } from '@views/vmnetworks/form/constants';

import {
  CUDN_CREATED,
  CUDN_MATCH_LABELS_USED,
  NAD_CREATED,
  UDN_CREATED,
  VM_NETWORK_CREATED,
  VM_NETWORK_MTU_CHANGED,
  VM_NETWORK_VLAN_ENABLED,
} from './constants';

export const logNetworkingEvent = (key: string, properties?: Record<string, any>) => {
  const { analytics, analyticsEnabled } = getSegmentAnalytics();

  if (!analyticsEnabled) {
    if (process.env.NODE_ENV === 'development') {
      networkConsole.warn('Telemetry disabled, ignoring event:', key);
    }
    return;
  }

  analytics.track(key, {
    ...properties,
    category: 'networking',
  });
};

const getSubnetProperties = (networkSpec: any): Record<string, any> => {
  const layer2Subnets = networkSpec?.layer2?.subnets;
  const layer3Subnets = networkSpec?.layer3?.subnets;
  const subnets = layer2Subnets || layer3Subnets?.map((subnet) => subnet.cidr) || [];

  const properties: Record<string, any> = {};

  if (subnets.length > 0) {
    properties.subnetCount = subnets.length;
    properties.cidrPrefixes = subnets
      .map((subnet) => parseInt(subnet.split('/')[1]))
      .filter((prefix) => !isNaN(prefix));
  }

  return properties;
};

export const logCreationFailed = (eventName: string, error: any) => {
  logNetworkingEvent(eventName, {
    errorMessage: error?.message || 'Unknown error',
  });
};

export const logNADCreated = (
  networkType?: string,
  creationMethod?: string,
  namespace?: string,
) => {
  logNetworkingEvent(NAD_CREATED, { creationMethod, namespace, networkType });
};

export const logUDNCreated = (resource: { spec?: any } & K8sResourceCommon) => {
  const networkSpec = resource?.spec;

  const properties: Record<string, any> = {
    namespace: resource?.metadata?.namespace,
    ...getSubnetProperties(networkSpec),
  };

  logNetworkingEvent(UDN_CREATED, properties);
};

export const logCUDNCreated = (resource: { spec?: any } & K8sResourceCommon) => {
  const networkSpec = resource?.spec?.network;

  const properties: Record<string, any> = {
    ...getSubnetProperties(networkSpec),
  };

  logNetworkingEvent(CUDN_CREATED, properties);

  const matchLabels = resource?.spec?.namespaceSelector?.matchLabels;
  if (matchLabels && !isEmpty(matchLabels)) {
    logNetworkingEvent(CUDN_MATCH_LABELS_USED, { labelCount: Object.keys(matchLabels).length });
  }
};

const projectMappingMethodMap: Record<ProjectMappingOption, string> = {
  [ProjectMappingOption.AllProjects]: 'all_projects',
  [ProjectMappingOption.SelectByLabels]: 'label_selector',
  [ProjectMappingOption.SelectFromList]: 'select_from_list',
};

export const logVMNetworkCreated = (
  resource: { spec?: any } & K8sResourceCommon,
  projectMappingOption: ProjectMappingOption,
) => {
  logNetworkingEvent(VM_NETWORK_CREATED, {
    projectMappingMethod: projectMappingMethodMap[projectMappingOption],
  });

  const localnet = resource?.spec?.network?.localnet;

  if (!isEmpty(localnet?.vlan)) {
    logNetworkingEvent(VM_NETWORK_VLAN_ENABLED, { vlanId: localnet.vlan.access?.id });
  }

  if (localnet?.mtu && localnet.mtu !== DEFAULT_MTU) {
    logNetworkingEvent(VM_NETWORK_MTU_CHANGED, { mtuValue: localnet.mtu });
  }
};
