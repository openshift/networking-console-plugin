import { FeatureFlag, FeatureFlagHookProvider } from '@openshift-console/dynamic-plugin-sdk';
import { EncodedExtension } from '@openshift-console/dynamic-plugin-sdk-webpack';

import { FLAG_NMSTATE_CRDS } from './consts';

export const FlagsExtensions: EncodedExtension[] = [
  {
    properties: {
      handler: { $codeRef: 'networkingFlags.enableNetworkingDynamicFlag' },
    },
    type: 'console.flag',
  } as EncodedExtension<FeatureFlag>,
  {
    properties: {
      handler: { $codeRef: 'networkingFlags.useUDNEnabledFlag' },
    },
    type: 'console.flag/hookProvider',
  } as EncodedExtension<FeatureFlagHookProvider>,
  {
    properties: {
      flag: FLAG_NMSTATE_CRDS,
      model: {
        group: 'nmstate.io',
        kind: 'NodeNetworkState',
        version: 'v1beta1',
      },
    },
    type: 'console.flag/model',
  },
];

export const FlagsExposedModules = {
  networkingFlags: './utils/flags',
};
