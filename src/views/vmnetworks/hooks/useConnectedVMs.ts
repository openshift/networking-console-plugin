import { useMemo } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import useConnectedVMsWithNamespace from '@views/vmnetworks/details/hooks/useConnectedVMsWithNamespace';

type UseConnectedVMs = (
  vmNetwork: ClusterUserDefinedNetworkKind,
) => [vms: V1VirtualMachine[], loaded: boolean, error: Error | undefined];

const useConnectedVMs: UseConnectedVMs = (vmNetwork) => {
  const [vmsWithNamespace, loaded, error] = useConnectedVMsWithNamespace(getName(vmNetwork));

  const vms = useMemo(() => vmsWithNamespace.map(({ vm }) => vm), [vmsWithNamespace]);

  return [vms, loaded, error];
};

export default useConnectedVMs;
