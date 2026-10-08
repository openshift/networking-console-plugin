import { useK8sModels } from '@openshift-console/dynamic-plugin-sdk';
import { SriovNetworkNodePolicyModelRef } from '@utils/models';
import { HyperConvergedModelRef } from '@utils/models';

const useNetworkModels = (): [hasHyperConvergedCRD: boolean, hasSriovNetNodePolicyCRD: boolean] => {
  const [models] = useK8sModels();

  const hasHyperConvergedCRD = !!models?.[HyperConvergedModelRef];

  const hasSriovNetNodePolicyCRD = !!models?.[SriovNetworkNodePolicyModelRef];
  return [hasHyperConvergedCRD, hasSriovNetNodePolicyCRD];
};
export default useNetworkModels;
