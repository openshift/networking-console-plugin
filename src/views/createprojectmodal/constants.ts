import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

type UDNSpec = {
  layer2: {
    ipamLifecycle: string;
    role: string;
    subnets: string[];
  };
  topology: string;
};

export const DESCRIPTION_ANNOTATION = 'openshift.io/description';
export const DISPLAY_NAME_ANNOTATION = 'openshift.io/display-name';

export type CreateProjectModalFormState = {
  createUDN: boolean;
  project: K8sResourceCommon & {
    metadata: {
      annotations: { [DESCRIPTION_ANNOTATION]: string; [DISPLAY_NAME_ANNOTATION]: string };
    };
  };
  udn: K8sResourceCommon & { spec: UDNSpec };
};

export const initialFormState: CreateProjectModalFormState = {
  createUDN: false,
  project: {
    metadata: {
      annotations: {
        [DESCRIPTION_ANNOTATION]: null,
        [DISPLAY_NAME_ANNOTATION]: null,
      },
      name: '',
    },
  },
  udn: {
    apiVersion: 'k8s.ovn.org/v1',
    kind: 'UserDefinedNetwork',
    metadata: {
      name: '',
      namespace: '',
    },
    spec: {
      layer2: {
        ipamLifecycle: 'Persistent',
        role: 'Primary',
        subnets: [],
      },
      topology: 'Layer2',
    },
  },
};
