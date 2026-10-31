import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { getLabels } from '@utils/resources/shared';

import { VIRT_LAUNCHER_POD_LABEL_KEY, VIRT_LAUNCHER_POD_LABEL_VALUE } from './constants';

export const isVirtLauncherPod = (pod: IoK8sApiCoreV1Pod): boolean =>
  getLabels(pod)?.[VIRT_LAUNCHER_POD_LABEL_KEY] === VIRT_LAUNCHER_POD_LABEL_VALUE;
