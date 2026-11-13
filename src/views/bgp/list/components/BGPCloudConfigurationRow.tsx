import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import { ResourceLink, RowProps, TableData } from '@openshift-console/dynamic-plugin-sdk';
import { Label } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { selectorText } from '@utils/resources/bgp/selectors';
import { BGPCloudConfiguration } from '@utils/resources/bgp/types';
import { condition } from '@utils/resources/bgp/utils';
import { getName } from '@utils/resources/shared';

import BGPListActions from '../../components/BGPListActions';
import { BGPStatus } from '../../components/BGPStatus';

const BGPCloudConfigurationRow: FC<RowProps<BGPCloudConfiguration>> = ({
  activeColumnIDs,
  obj,
}) => {
  const { t } = useNetworkingTranslation();
  const available = condition(obj.status?.conditions);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(BGPCloudConfigurationModel)}
          name={getName(obj)}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="platform">
        {obj.spec?.platform}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="asn">
        {obj.spec?.bgp?.localASN}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="selector">
        {selectorText(obj.spec?.routerNodeSelector) || t('None')}
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
        <BGPListActions model={BGPCloudConfigurationModel} obj={obj} />
      </TableData>
    </>
  );
};

export default BGPCloudConfigurationRow;
