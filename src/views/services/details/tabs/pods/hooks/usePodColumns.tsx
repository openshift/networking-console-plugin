import { useMemo } from 'react';
import classNames from 'classnames';

import { modelToRef, PodModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Pod } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  PrometheusResponse,
  TableColumn,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import { sortable } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH } from '../constants';
import {
  getPodCPUUsage,
  getPodMemoryUsage,
  podPhase,
  podReadiness,
  podRestarts,
  sortResourceByValue,
} from '../utils';

const showMetrics =
  PROMETHEUS_BASE_PATH && PROMETHEUS_TENANCY_BASE_PATH && window.screen.width >= 1200;

export const podColumnInfo = Object.freeze({
  cpu: {
    classes: classNames({ 'pf-v6-u-w-10-on-2xl': showMetrics }),
    id: 'cpu',
  },
  created: {
    classes: classNames('pf-v6-u-w-10-on-2xl'),
    id: 'created',
  },
  ipaddress: {
    classes: '',
    id: 'ipaddress',
  },
  labels: {
    classes: '',
    id: 'labels',
  },
  memory: {
    classes: classNames({ 'pf-v6-u-w-10-on-2xl': showMetrics }),
    id: 'memory',
  },
  name: {
    classes: '',
    id: 'name',
  },
  namespace: {
    classes: '',
    id: 'namespace',
  },
  node: {
    classes: '',
    id: 'node',
  },
  owner: {
    classes: '',
    id: 'owner',
  },
  ready: {
    classes: classNames('pf-m-nowrap', 'pf-v6-u-w-10-on-lg', 'pf-v6-u-w-8-on-xl'),
    id: 'ready',
  },
  restarts: {
    classes: classNames('pf-m-nowrap', 'pf-v6-u-w-8-on-2xl'),
    id: 'restarts',
  },
  status: {
    classes: '',
    id: 'status',
  },
  traffic: {
    classes: '',
    id: 'trafficStatus',
  },
});

const usePodColumns = (
  cpuUsageData: PrometheusResponse,
  memoryUsageData: PrometheusResponse,
): { id: string; title: string }[] => {
  const { t } = useNetworkingTranslation();

  const columns: TableColumn<IoK8sApiCoreV1Pod>[] = useMemo(
    () => [
      {
        id: podColumnInfo.name.id,
        props: { className: podColumnInfo.name.classes },
        sort: 'metadata.name',
        title: t('Name'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.namespace.id,
        props: { className: podColumnInfo.namespace.classes },
        sort: 'metadata.namespace',
        title: t('Namespace'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.status.id,
        props: { className: podColumnInfo.status.classes },
        sort: (data, direction) =>
          data.sort(sortResourceByValue<IoK8sApiCoreV1Pod>(direction, podPhase)),
        title: t('Status'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.ready.id,
        props: { className: podColumnInfo.ready.classes },
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<IoK8sApiCoreV1Pod>(
              direction,
              (obj) => podReadiness(obj).readyCount,
            ),
          ),
        title: t('Ready'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.restarts.id,
        props: { className: podColumnInfo.restarts.classes },
        sort: (data, direction) =>
          data.sort(sortResourceByValue<IoK8sApiCoreV1Pod>(direction, podRestarts)),
        title: t('Restarts'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.owner.id,
        props: { className: podColumnInfo.owner.classes },
        sort: 'metadata.ownerReferences[0].name',
        title: t('Owner'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.memory.id,
        props: { className: podColumnInfo.memory.classes },
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<IoK8sApiCoreV1Pod>(direction, (obj) =>
              getPodMemoryUsage(memoryUsageData, obj),
            ),
          ),
        title: t('Memory'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.cpu.id,
        props: { className: podColumnInfo.cpu.classes },
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<IoK8sApiCoreV1Pod>(direction, (obj) =>
              getPodCPUUsage(cpuUsageData, obj),
            ),
          ),
        title: t('CPU'),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.created.id,
        props: { className: podColumnInfo.created.classes },
        sort: 'metadata.creationTimestamp',
        title: t('Created'),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.node.id,
        props: { className: podColumnInfo.node.classes },
        sort: 'spec.nodeName',
        title: t('Node'),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.labels.id,
        props: { className: podColumnInfo.labels.classes },
        sort: 'metadata.labels',
        title: t('Labels'),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.ipaddress.id,
        props: { className: podColumnInfo.ipaddress.classes },
        sort: 'status.podIP',
        title: t('IP address'),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.traffic.id,
        props: { className: podColumnInfo.traffic.classes },
        title: t('Receiving Traffic'),
      },
      {
        id: '',
        title: '',
      },
    ],
    [cpuUsageData, memoryUsageData, t],
  );

  const [activeColumns] = useActiveColumns<IoK8sApiCoreV1Pod>({
    columnManagementID: modelToRef(PodModel) + 'service-tab',
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default usePodColumns;
