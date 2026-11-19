import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import type {
  K8sResourceKind,
  TableColumn,
  WatchK8sResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ListPageBody,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { PageSection } from '@patternfly/react-core';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { FRRConfigurationModel } from '@utils/models';

import GeneratedResourceRow from './GeneratedResourceRow';

export type GeneratedResourcesTabProps = {
  model: typeof FRRConfigurationModel;
  title: string;
  watchOptions?: Pick<WatchK8sResource, 'fieldSelector' | 'namespace' | 'selector'>;
};

const GeneratedResourcesTab: FC<GeneratedResourcesTabProps> = ({ model, title, watchOptions }) => {
  const { t } = useNetworkingTranslation();
  const [resources, loaded, error] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: modelToGroupVersionKind(model),
    isList: true,
    ...watchOptions,
  });
  const columns = [
    { id: 'name', title: t('Name') },
    ...(model.namespaced ? [{ id: 'namespace', title: t('Namespace') }] : []),
  ] as TableColumn<K8sResourceKind>[];

  return (
    <PageSection>
      <DetailsSectionTitle titleText={title} />
      <ListPageBody>
        <VirtualizedTable
          columns={columns}
          data={resources || []}
          loaded={loaded}
          loadError={error}
          Row={(props) => <GeneratedResourceRow {...props} model={model} />}
          unfilteredData={resources || []}
        />
      </ListPageBody>
    </PageSection>
  );
};

export default GeneratedResourcesTab;
