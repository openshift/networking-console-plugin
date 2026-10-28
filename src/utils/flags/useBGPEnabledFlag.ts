import { SetFeatureFlag, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import {
  BGPCloudConfigurationModelGroupVersionKind,
  BGPRoutingModelGroupVersionKind,
} from '@utils/models';
import { isEmpty } from '@utils/utils';

import { FLAG_BGP_ENABLED } from './consts';

export const useBGPEnabledFlag = (setFeatureFlag: SetFeatureFlag) => {
  const [configurationModel] = useK8sModel(BGPCloudConfigurationModelGroupVersionKind);
  const [routingModel] = useK8sModel(BGPRoutingModelGroupVersionKind);

  setFeatureFlag(FLAG_BGP_ENABLED, !isEmpty(configurationModel) && !isEmpty(routingModel));
};
