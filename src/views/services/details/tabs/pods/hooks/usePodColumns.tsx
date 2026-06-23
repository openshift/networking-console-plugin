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

type NetworkingTFunction = ReturnType<typeof useNetworkingTranslation>['t'];

export const getPodColumnInfo = (t: NetworkingTFunction) =>
  Object.freeze({
    cpu: { ...podColumnInfo.cpu, title: t('CPU') },
    created: { ...podColumnInfo.created, title: t('Created') },
    ipaddress: { ...podColumnInfo.ipaddress, title: t('IP address') },
    labels: { ...podColumnInfo.labels, title: t('Labels') },
    memory: { ...podColumnInfo.memory, title: t('Memory') },
    name: { ...podColumnInfo.name, title: t('Name') },
    namespace: { ...podColumnInfo.namespace, title: t('Namespace') },
    node: { ...podColumnInfo.node, title: t('Node') },
    owner: { ...podColumnInfo.owner, title: t('Owner') },
    ready: { ...podColumnInfo.ready, title: t('Ready') },
    restarts: { ...podColumnInfo.restarts, title: t('Restarts') },
    status: { ...podColumnInfo.status, title: t('Status') },
    traffic: { ...podColumnInfo.traffic, title: t('Receiving Traffic') },
  });


const usePodColumns = (
  cpuUsageData: PrometheusResponse,
  memoryUsageData: PrometheusResponse,
): { id: string; title: string }[] => {
  const { t } = useNetworkingTranslation();

  const podColumnInfoWithTitles = useMemo(() => getPodColumnInfo(t), [t]);

  const columns: TableColumn<IoK8sApiCoreV1Pod>[] = useMemo(
    () => [
      {
        id: podColumnInfoWithTitles.name.id,
        props: { className: podColumnInfoWithTitles.name.classes },
        sort: 'metadata.name',
        title: podColumnInfoWithTitles.name.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.namespace.id,
        props: { className: podColumnInfoWithTitles.namespace.classes },
        sort: 'metadata.namespace',
        title: podColumnInfoWithTitles.namespace.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.status.id,
        props: { className: podColumnInfoWithTitles.status.classes },
        sort: (data, direction) =>
          data.sort(sortResourceByValue<IoK8sApiCoreV1Pod>(direction, podPhase)),
        title: podColumnInfoWithTitles.status.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.ready.id,
        props: { className: podColumnInfoWithTitles.ready.classes },
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<IoK8sApiCoreV1Pod>(
              direction,
              (obj) => podReadiness(obj).readyCount,
            ),
          ),
        title: podColumnInfoWithTitles.ready.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.restarts.id,
        props: { className: podColumnInfoWithTitles.restarts.classes },
        sort: (data, direction) =>
          data.sort(sortResourceByValue<IoK8sApiCoreV1Pod>(direction, podRestarts)),
        title: podColumnInfoWithTitles.restarts.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.owner.id,
        props: { className: podColumnInfoWithTitles.owner.classes },
        sort: 'metadata.ownerReferences[0].name',
        title: podColumnInfoWithTitles.owner.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.memory.id,
        props: { className: podColumnInfoWithTitles.memory.classes },
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<IoK8sApiCoreV1Pod>(direction, (obj) =>
              getPodMemoryUsage(memoryUsageData, obj),
            ),
          ),
        title: podColumnInfoWithTitles.memory.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.cpu.id,
        props: { className: podColumnInfoWithTitles.cpu.classes },
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<IoK8sApiCoreV1Pod>(direction, (obj) =>
              getPodCPUUsage(cpuUsageData, obj),
            ),
          ),
        title: podColumnInfoWithTitles.cpu.title,
        transforms: [sortable],
      },
      {
        id: podColumnInfoWithTitles.created.id,
        props: { className: podColumnInfoWithTitles.created.classes },
        sort: 'metadata.creationTimestamp',
        title: podColumnInfoWithTitles.created.title,
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfoWithTitles.node.id,
        props: { className: podColumnInfoWithTitles.node.classes },
        sort: 'spec.nodeName',
        title: podColumnInfoWithTitles.node.title,
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfoWithTitles.labels.id,
        props: { className: podColumnInfoWithTitles.labels.classes },
        sort: 'metadata.labels',
        title: podColumnInfoWithTitles.labels.title,
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfoWithTitles.ipaddress.id,
        props: { className: podColumnInfoWithTitles.ipaddress.classes },
        sort: 'status.podIP',
        title: podColumnInfoWithTitles.ipaddress.title,
        transforms: [sortable],
      },
      {
        additional: true,
        id: podColumnInfoWithTitles.traffic.id,
        props: { className: podColumnInfoWithTitles.traffic.classes },
        title: podColumnInfoWithTitles.traffic.title,
      },
      {
        id: '',
        title: '',
      },
    ],
    [cpuUsageData, memoryUsageData, podColumnInfoWithTitles],
  );

  const [activeColumns] = useActiveColumns<IoK8sApiCoreV1Pod>({
    columnManagementID: modelToRef(PodModel) + 'service-tab',
    columns,
    showNamespaceOverride: false,
  });

  return activeColumns;
};

export default usePodColumns;