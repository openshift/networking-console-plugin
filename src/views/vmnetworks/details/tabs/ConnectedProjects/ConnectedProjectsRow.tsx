import React, { FC } from 'react';

import { ResourceLink, RowProps, TableData } from '@openshift-console/dynamic-plugin-sdk';
import { ProjectGroupVersionKind } from '@utils/hooks/useProjects/constants';

import { ProjectWithVMCount } from '../../types';

type ConnectedProjectsRowProps = RowProps<ProjectWithVMCount>;

const ConnectedProjectsRow: FC<ConnectedProjectsRowProps> = ({ activeColumnIDs, obj }) => {
  const { projectName, vmCount } = obj;

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={ProjectGroupVersionKind}
          key={projectName}
          name={projectName}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="connected-vms">
        {vmCount}
      </TableData>
    </>
  );
};

export default ConnectedProjectsRow;
