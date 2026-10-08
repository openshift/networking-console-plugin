import React, { FC } from 'react';

import {
  ListPageFilter,
  PrometheusEndpoint,
  useK8sWatchResource,
  useListPageFilter,
  usePrometheusPoll,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { PageSection } from '@patternfly/react-core';
import { getGroupVersionKindForModel, PodModel } from '@utils/models';
import { getNamespace } from '@utils/resources/shared';
import { Pod, Service } from '@utils/types/k8sTypes';

import PodRow from './components/PodRow';
import usePodColumns from './hooks/usePodColumns';
import { usePodFilters } from './hooks/usePodFilters';
import { MIGRATION__PROMETHEUS_DELAY } from './constants';
import { getCPUUsageQuery, getMemoryUsageQuery } from './utils';

type ServicePodsProps = {
  obj?: Service;
};

const ServicePods: FC<ServicePodsProps> = ({ obj: service }) => {
  const namespace = getNamespace(service);
  const selector = service?.spec?.selector;

  const [memoryUsageData] = usePrometheusPoll({
    delay: MIGRATION__PROMETHEUS_DELAY,
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query: getMemoryUsageQuery(namespace),
  });

  const [cpuUsageData] = usePrometheusPoll({
    delay: MIGRATION__PROMETHEUS_DELAY,
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query: getCPUUsageQuery(namespace),
  });

  const [pods, loaded, loadError] = useK8sWatchResource<Pod[]>({
    groupVersionKind: getGroupVersionKindForModel(PodModel),
    isList: true,
    namespace,
    selector,
  });

  const podFilters = usePodFilters();

  const [data, filteredData, onFilterChange] = useListPageFilter(pods, podFilters);
  const columns = usePodColumns(cpuUsageData, memoryUsageData);

  return (
    <PageSection>
      <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
      <VirtualizedTable<Pod>
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        Row={PodRow}
        rowData={{ cpuUsageData, memoryUsageData }}
        unfilteredData={data}
      />
    </PageSection>
  );
};

export default ServicePods;
