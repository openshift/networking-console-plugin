import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { NetworkPolicyModel } from '@utils/models';
import { MultiNetworkPolicyModel } from '@utils/models';

export const getPolicyModel = (obj: K8sResourceCommon) =>
  obj.kind === MultiNetworkPolicyModel.kind ? MultiNetworkPolicyModel : NetworkPolicyModel;
