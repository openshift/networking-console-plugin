import React, { FC } from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { modelToGroupVersionKind, PodModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Pod } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  PrometheusResponse,
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { podColumnInfo } from '../hooks/usePodColumns';
import { formatBytesAsMiB, formatCores } from '../units';
import { getPodCPUUsage, getPodMemoryUsage, podPhase, podReadiness, podRestarts } from '../utils';

import { PodStatus } from './PodStatus';
import { PodTraffic } from './PodTraffic';

type PodRowType = RowProps<
  IoK8sApiCoreV1Pod,
  { cpuUsageData: PrometheusResponse; memoryUsageData: PrometheusResponse }
>;

const PodRow: FC<PodRowType> = ({
  activeColumnIDs,
  obj: pod,
  rowData: { cpuUsageData, memoryUsageData },
}) => {
  const { t } = useNetworkingTranslation();
  const { creationTimestamp, labels, name, namespace } = pod.metadata;

  const { readyCount, totalContainers } = podReadiness(pod);
  const phase = podPhase(pod);
  const restarts = podRestarts(pod);
  const context = { [`core~${PodModel.apiVersion}~${PodModel.kind}`]: pod };

  const cores = getPodCPUUsage(cpuUsageData, pod);
  const bytes = getPodMemoryUsage(memoryUsageData, pod);

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.name.classes}
        id={podColumnInfo.name.id}
      >
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(PodModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={classNames(podColumnInfo.namespace.classes, 'co-break-word')}
        id={podColumnInfo.namespace.id}
      >
        <ResourceLink kind="Namespace" name={namespace} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.status.classes}
        id={podColumnInfo.status.id}
      >
        <PodStatus pod={pod} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.ready.classes}
        id={podColumnInfo.ready.id}
      >
        {readyCount}/{totalContainers}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.restarts.classes}
        id={podColumnInfo.restarts.id}
      >
        {restarts}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.owner.classes}
        id={podColumnInfo.owner.id}
      >
        <OwnerReferences resource={pod} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.memory.classes}
        id={podColumnInfo.memory.id}
      >
        {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.cpu.classes}
        id={podColumnInfo.cpu.id}
      >
        {cores ? t('{{numCores}} cores', { numCores: formatCores(cores) }) : '-'}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.created.classes}
        id={podColumnInfo.created.id}
      >
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.node.classes}
        id={podColumnInfo.node.id}
      >
        <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.labels.classes}
        id={podColumnInfo.labels.id}
      >
        <LabelList groupVersionKind={modelToGroupVersionKind(PodModel)} labels={labels} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.ipaddress.classes}
        id={podColumnInfo.ipaddress.id}
      >
        {pod?.status?.podIP ?? '-'}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={podColumnInfo.traffic.classes}
        id={podColumnInfo.traffic.id}
      >
        <PodTraffic namespace={namespace} podName={name} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="">
        <LazyActionMenu context={context} isDisabled={phase === 'Terminating'} />
      </TableData>
    </>
  );
};
export default PodRow;
