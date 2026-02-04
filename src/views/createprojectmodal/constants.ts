import { t } from '@utils/hooks/useNetworkingTranslation';
import { FIXED_PRIMARY_UDN_NAME, LAYER2_TOPOLOGY } from '@utils/resources/udns/constants';
import { UserDefinedNetworkRole } from '@utils/resources/udns/types';

import { CreateProjectModalFormState, NETWORK_TYPE } from './types';

export const DESCRIPTION_ANNOTATION = 'openshift.io/description';
export const DISPLAY_NAME_ANNOTATION = 'openshift.io/display-name';

export const networkTypeLabels = {
  [NETWORK_TYPE.POD_NETWORK]: t('Use the default Pod network'),
  [NETWORK_TYPE.UDN]: t('Define a new UserDefinedNetwork for this project'),
  // eslint-disable-next-line perfectionist/sort-objects
  [NETWORK_TYPE.CLUSTER_UDN]: t('Refer an existing ClusterUserDefinedNetwork'),
};

export const initialFormState: CreateProjectModalFormState = {
  networkType: NETWORK_TYPE.POD_NETWORK,
  project: {
    description: '',
    displayName: '',
    metadata: {
      name: '',
    },
  },
  udn: {
    apiVersion: 'k8s.ovn.org/v1',
    kind: 'UserDefinedNetwork',
    metadata: {
      name: FIXED_PRIMARY_UDN_NAME,
      namespace: '',
    },
    spec: {
      layer2: {
        ipam: { lifecycle: 'Persistent' },
        role: UserDefinedNetworkRole.Primary,
        subnets: [],
      },
      topology: LAYER2_TOPOLOGY,
    },
  },
};
