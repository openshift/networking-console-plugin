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
];

export const FlagsExposedModules = {
  networkingFlags: './utils/flags',
};
