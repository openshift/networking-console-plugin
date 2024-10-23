import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { SetFeatureFlag, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { UserDefinedNetworkModel } from '@utils/models';
import { isEmpty } from '@utils/utils';

import { FLAG_UDN_ENABLED } from './consts';

export const useUDNEnabledFlag = (setFeatureFlag: SetFeatureFlag) => {
  const [udnModel, loaded] = useK8sModel(modelToGroupVersionKind(UserDefinedNetworkModel));

  if (!loaded) return;

  setFeatureFlag(FLAG_UDN_ENABLED, !isEmpty(udnModel));
};
