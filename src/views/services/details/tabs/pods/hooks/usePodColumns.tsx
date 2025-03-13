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
    title: 'CPU',
  },
  created: {
    classes: classNames('pf-v6-u-w-10-on-2xl'),
    id: 'created',
    title: 'Created',
  },
  ipaddress: {
    classes: '',
    id: 'ipaddress',
    title: 'IP address',
  },
  labels: {
    classes: '',
    id: 'labels',
    title: 'Labels',
  },
  memory: {
    classes: classNames({ 'pf-v6-u-w-10-on-2xl': showMetrics }),
    id: 'memory',
    title: 'Memory',
  },
  name: {
    classes: '',
    id: 'name',
    title: 'Name',
  },
  namespace: {
    classes: '',
    id: 'namespace',
    title: 'Namespace',
  },
  node: {
    classes: '',
    id: 'node',
    title: 'Node',
  },
  owner: {
    classes: '',
    id: 'owner',
    title: 'Owner',
  },
  ready: {
    classes: classNames('pf-m-nowrap', 'pf-v6-u-w-10-on-lg', 'pf-v6-u-w-8-on-xl'),
    id: 'ready',
    title: 'Ready',
  },
  restarts: {
    classes: classNames('pf-m-nowrap', 'pf-v6-u-w-8-on-2xl'),
    id: 'restarts',
    title: 'Restarts',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'Status',
  },
  traffic: {
    classes: '',
    id: 'trafficStatus',
    title: 'Receiving Traffic',
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
        title: t(podColumnInfo.name.title),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.namespace.id,
        props: { className: podColumnInfo.namespace.classes },
        sort: 'metadata.namespace',
        title: t(podColumnInfo.namespace.title),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.status.id,
        props: { className: podColumnInfo.status.classes },
        sort: (data, direction) =>
          data.sort(sortResourceByValue<IoK8sApiCoreV1Pod>(direction, podPhase)),
        title: t(podColumnInfo.status.title),
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
        title: t(podColumnInfo.ready.title),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.restarts.id,
        props: { className: podColumnInfo.restarts.classes },
        sort: (data, direction) =>
          data.sort(sortResourceByValue<IoK8sApiCoreV1Pod>(direction, podRestarts)),
        title: t(podColumnInfo.restarts.title),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.owner.id,
        props: { className: podColumnInfo.owner.classes },
        sort: 'metadata.ownerReferences[0].name',
        title: t(podColumnInfo.owner.title),
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
        title: t(podColumnInfo.memory.title),
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
        title: t(podColumnInfo.cpu.title),
        transforms: [sortable],
      },
      {
        id: podColumnInfo.created.id,
        props: { className: podColumnInfo.created.classes },
        sort: 'metadata.creationTimestamp',
        title: t(podColumnInfo.created.title),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.node.id,
        props: { className: podColumnInfo.node.classes },
        sort: 'spec.nodeName',
        title: t(podColumnInfo.node.title),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.labels.id,
        props: { className: podColumnInfo.labels.classes },
        sort: 'metadata.labels',
        title: t(podColumnInfo.labels.title),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.ipaddress.id,
        props: { className: podColumnInfo.ipaddress.classes },
        sort: 'status.podIP',
        title: t(podColumnInfo.ipaddress.title),
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfo.traffic.id,
        props: { className: podColumnInfo.traffic.classes },
        title: t(podColumnInfo.traffic.title),
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
