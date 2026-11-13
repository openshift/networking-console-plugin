import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { ResourceLink, RowProps, TableData } from '@openshift-console/dynamic-plugin-sdk';
import { Label } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp/types';
import { condition } from '@utils/resources/bgp/utils';
import { getName } from '@utils/resources/shared';

import BGPListActions from '../../components/BGPListActions';
import { BGPStatus } from '../../components/BGPStatus';

const BGPRoutingRow: FC<RowProps<BGPRouting>> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const available = condition(obj.status?.conditions);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(BGPRoutingModel)}
          name={getName(obj)}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="network">
        {obj.spec?.network?.name}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="subnets">
        {obj.spec?.network?.subnets?.join(', ')}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="phase">
        <BGPStatus condition={available} phase={obj.status?.phase} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="availability">
        <Label color={available?.status === 'True' ? 'green' : 'red'}>
          {available?.status || t('Unknown')}
        </Label>
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="reason">
        {available?.reason || t('Not available')}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="created">
        {obj.metadata?.creationTimestamp
          ? new Date(obj.metadata.creationTimestamp).toLocaleString()
          : '-'}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="actions">
        <BGPListActions model={BGPRoutingModel} obj={obj} />
      </TableData>
    </>
  );
};

export default BGPRoutingRow;
