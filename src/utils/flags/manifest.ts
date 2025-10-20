import { EncodedExtension } from '@openshift/dynamic-plugin-sdk-webpack';
import { FeatureFlag, FeatureFlagHookProvider } from '@openshift-console/dynamic-plugin-sdk';

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
      flag: 'NMSTATE_PLUGIN_ENABLED',
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
