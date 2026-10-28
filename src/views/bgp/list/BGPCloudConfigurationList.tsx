import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  ListPageBody,
  ResourceLink,
  RowProps,
  TableColumn,
  TableData,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { Label, PageSection } from '@patternfly/react-core';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { BGPCloudConfiguration, condition, selectorText } from '@utils/resources/bgp';
import { resourcePathFromModel } from '@utils/resources/shared';

import BGPListActions from '../components/BGPListActions';
import { BGPStatus } from '../components/BGPStatus';

const Row: FC<RowProps<BGPCloudConfiguration>> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const available = condition(obj.status?.conditions);
  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(BGPCloudConfigurationModel)}
          name={obj.metadata?.name}
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

const BGPCloudConfigurationList: FC = () => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [items, loaded, error] = useK8sWatchResource<BGPCloudConfiguration[]>({
    groupVersionKind: modelToGroupVersionKind(BGPCloudConfigurationModel),
    isList: true,
  });
  const columns = useMemo<TableColumn<BGPCloudConfiguration>[]>(
    () => [
      { id: 'name', title: t('Name') },
      { id: 'platform', title: t('Platform') },
      { id: 'asn', title: t('Local ASN') },
      { id: 'selector', title: t('Router nodes') },
      { id: 'phase', title: t('Phase') },
      { id: 'availability', title: t('Availability') },
      { id: 'reason', title: t('Reason') },
      { id: 'created', title: t('Created') },
      { id: 'actions', title: t('Actions') },
    ],
    [t],
  );
  const createPath = `${resourcePathFromModel(BGPCloudConfigurationModel)}/~new/form`;
  return (
    <ListEmptyState
      data={items}
      error={error}
      kind={BGPCloudConfigurationModel.kind}
      learnMoreLink="https://docs.openshift.com/container-platform/latest/networking/"
      loaded={loaded}
      onCreate={() => navigate(createPath)}
      title={t('BGP cloud configurations')}
    >
      <>
        <PageSection>
          <p className="pf-v6-u-mb-0">
            {t(
              'BGPCloudConfiguration is a cluster-wide singleton. The configuration must be named cluster.',
            )}
          </p>
        </PageSection>
        <ListPageBody>
          <VirtualizedTable
            columns={columns}
            data={items || []}
            loaded={loaded}
            loadError={error}
            Row={Row}
            unfilteredData={items || []}
          />
        </ListPageBody>
      </>
    </ListEmptyState>
  );
};
export default BGPCloudConfigurationList;
