import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import useNonSystemProjects from '@utils/hooks/useNonSystemProjects';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { getVMNetworkProjects } from '@utils/resources/vmnetworks/utils';

const useVMNetworkMatchedProjects = (
  vmNetwork: ClusterUserDefinedNetworkKind,
): [matchingProjects: K8sResourceCommon[], loaded: boolean] => {
  const [projects, loaded] = useNonSystemProjects();

  const matchingProjects = getVMNetworkProjects(vmNetwork, projects);

  return [matchingProjects, loaded];
};

export default useVMNetworkMatchedProjects;
