import { useMemo } from 'react';

import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import useProjects from '@utils/hooks/useProjects/useProjects';
import { getName } from '@utils/resources/shared';
import { isSystemNamespace } from '@utils/utils/helpers';

const useNonSystemProjects = (): [K8sResourceCommon[], boolean, Error] => {
  const [projects, loaded, error] = useProjects();

  const nonSystemProjects = useMemo(
    () => projects?.filter((project) => !isSystemNamespace(getName(project))) ?? [],
    [projects],
  );

  return [nonSystemProjects, loaded, error];
};

export default useNonSystemProjects;
