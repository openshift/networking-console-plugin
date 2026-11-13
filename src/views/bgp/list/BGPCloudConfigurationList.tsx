import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  ListPageBody,
  TableColumn,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { PageSection } from '@patternfly/react-core';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { BGPCloudConfiguration } from '@utils/resources/bgp/types';
import { resourcePathFromModel } from '@utils/resources/shared';

import BGPCloudConfigurationRow from './components/BGPCloudConfigurationRow';

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
            Row={BGPCloudConfigurationRow}
            unfilteredData={items || []}
          />
        </ListPageBody>
      </>
    </ListEmptyState>
  );
};
export default BGPCloudConfigurationList;
