import React, { FC } from 'react';

import { modelToGroupVersionKind, PodModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  IoK8sApiCoreV1Pod,
  IoK8sApiCoreV1Service,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ListPageFilter,
  PrometheusEndpoint,
  useK8sWatchResource,
  useListPageFilter,
  usePrometheusPoll,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { getNamespace } from '@utils/resources/shared';

import PodRow from './components/PodRow';
import usePodColumns from './hooks/usePodColumns';
import { usePodFilters } from './hooks/usePodFilters';
import { MIGRATION__PROMETHEUS_DELAY } from './constants';
import { getCPUUsageQuery, getMemoryUsageQuery } from './utils';
import { PageSection } from '@patternfly/react-core';

type ServicePodsProps = {
  obj?: IoK8sApiCoreV1Service;
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

  const [pods, loaded, loadError] = useK8sWatchResource<IoK8sApiCoreV1Pod[]>({
    groupVersionKind: modelToGroupVersionKind(PodModel),
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
      <VirtualizedTable<IoK8sApiCoreV1Pod>
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
