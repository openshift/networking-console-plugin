import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import useConnectedVMsWithNamespace from '@views/vmnetworks/details/hooks/useConnectedVMsWithNamespace';
import { ProjectWithVMCount } from '@views/vmnetworks/details/types';
import useVMNetworkMatchedProjects from '@views/vmnetworks/hooks/useVMNetworkMatchedProjects';

type UseProjectsWithVMCounts = (
  obj: ClusterUserDefinedNetworkKind,
) => [projectsWithVMCounts: ProjectWithVMCount[], loaded: boolean, error: Error];

const useProjectsWithVMCounts: UseProjectsWithVMCounts = (obj) => {
  const [matchingProjects, projectsLoaded] = useVMNetworkMatchedProjects(obj);
  const [vmsWithNetworkNamespace, vmsLoaded, vmsError] = useConnectedVMsWithNamespace(getName(obj));

  const result = matchingProjects.map((project) => {
    const projectName = getName(project);
    return {
      projectName,
      vmCount: vmsWithNetworkNamespace.filter(({ namespace }) => namespace === projectName).length,
    };
  });

  return [result, projectsLoaded && vmsLoaded, vmsError];
};

export default useProjectsWithVMCounts;
