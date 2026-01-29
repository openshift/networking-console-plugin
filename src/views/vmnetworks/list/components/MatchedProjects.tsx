import React, { FC } from 'react';

import ExpandableProjectList from '@utils/components/ExpandableProjectList/ExpandableProjectList';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import useVMNetworkMatchedProjects from '@views/vmnetworks/hooks/useVMNetworkMatchedProjects';

type MatchedProjectsProps = {
  obj: ClusterUserDefinedNetworkKind;
};

const MatchedProjects: FC<MatchedProjectsProps> = ({ obj }) => {
  const { t } = useNetworkingTranslation();
  const [matchingProjects, loaded] = useVMNetworkMatchedProjects(obj);

  return (
    <ExpandableProjectList
      emptyMessage={t('No projects matched')}
      loaded={loaded}
      projectNames={matchingProjects.map(getName)}
    />
  );
};

export default MatchedProjects;
