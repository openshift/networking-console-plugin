// This logic is replicated from k8s (at this writing, Kubernetes 1.17)

import * as _ from 'lodash';

import { K8sResourceCommon, PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk';
import { SortByDirection } from '@patternfly/react-table';
import { getName, getNamespace } from '@utils/resources/shared';
import { ContainerStatus, Pod } from '@utils/types/k8sTypes';

export type PodPhase = string;

// (See https://github.com/kubernetes/kubernetes/blob/release-1.17/pkg/printers/internalversion/printers.go)
export const podPhase = (pod: Pod): PodPhase => {
  if (!pod || !pod.status) {
    return '';
  }

  if (pod.metadata.deletionTimestamp) {
    return 'Terminating';
  }

  if (pod.status.reason === 'NodeLost') {
    return 'Unknown';
  }

  if (pod.status.reason === 'Evicted') {
    return 'Evicted';
  }

  let initializing = false;
  let phase = pod.status.phase || pod.status.reason;

  _.each(pod.status.initContainerStatuses, (container: ContainerStatus, i: number) => {
    const { terminated, waiting } = container.state;
    if (terminated && terminated.exitCode === 0) {
      return true;
    }

    initializing = true;
    if (terminated && terminated.reason) {
      phase = `Init:${terminated.reason}`;
    } else if (terminated && !terminated.reason) {
      phase = terminated.signal
        ? `Init:Signal:${terminated.signal}`
        : `Init:ExitCode:${terminated.exitCode}`;
    } else if (waiting && waiting.reason && waiting.reason !== 'PodInitializing') {
      phase = `Init:${waiting.reason}`;
    } else {
      phase = `Init:${i}/${pod.status.initContainerStatuses.length}`;
    }
    return false;
  });

  if (!initializing) {
    let hasRunning = false;
    const containerStatuses = pod.status.containerStatuses || [];
    for (let i = containerStatuses.length - 1; i >= 0; i--) {
      const {
        ready,
        state: { running, terminated, waiting },
      } = containerStatuses[i];
      if (terminated && terminated.reason) {
        phase = terminated.reason;
      } else if (waiting && waiting.reason) {
        phase = waiting.reason;
      } else if (waiting && !waiting.reason) {
        phase = terminated.signal
          ? `Signal:${terminated.signal}`
          : `ExitCode:${terminated.exitCode}`;
      } else if (running && ready) {
        hasRunning = true;
      }
    }

    // Change pod status back to "Running" if there is at least one container
    // still reporting as "Running" status.
    if (phase === 'Completed' && hasRunning) {
      phase = 'Running';
    }
  }

  return phase;
};

export const podPhaseFilterReducer = (pod: Pod): PodPhase => {
  const status = podPhase(pod);
  if (status === 'Terminating') {
    return status;
  }
  if (status.includes('CrashLoopBackOff')) {
    return 'CrashLoopBackOff';
  }
  return _.get(pod, 'status.phase', 'Unknown');
};

const isNumber = (value): value is number => Number.isFinite(value);

export const sortResourceByValue =
  <D = any, V = any>(sortDirection: SortByDirection, valueGetter: (obj: D) => V) =>
  (a: D, b: D): number => {
    const lang = navigator.languages[0] || navigator.language;
    // Use `localCompare` with `numeric: true` for a natural sort order (e.g., pv-1, pv-9, pv-10)
    const compareOpts = { ignorePunctuation: true, numeric: true };
    const aValue = valueGetter(a);
    const bValue = valueGetter(b);
    const result: number =
      isNumber(aValue) && isNumber(bValue)
        ? aValue - bValue
        : `${aValue}`.localeCompare(`${bValue}`, lang, compareOpts);
    if (result !== 0) {
      return sortDirection === SortByDirection.asc ? result : result * -1;
    }

    // Use name as a secondary sort for a stable sort.
    const aName = (a as K8sResourceCommon)?.metadata?.name || '';
    const bName = (b as K8sResourceCommon)?.metadata?.name || '';
    return aName.localeCompare(bName, lang, compareOpts);
  };

export const podReadiness = (pod: Pod): { readyCount: number; totalContainers: number } => {
  // Don't include init containers in readiness count. This is consistent with the CLI.
  const containerStatuses = pod?.status?.containerStatuses || [];
  return containerStatuses.reduce(
    (acc, { ready }: ContainerStatus) => {
      if (ready) {
        acc.readyCount = acc.readyCount + 1;
      }
      return acc;
    },
    { readyCount: 0, totalContainers: containerStatuses.length },
  );
};

export const podRestarts = (pod: Pod): number => {
  if (!pod || !pod.status) {
    return 0;
  }
  const { containerStatuses = [], initContainerStatuses = [] } = pod.status;
  const isInitializing = initContainerStatuses.some(({ state }) => {
    return !state.terminated || state.terminated.exitCode !== 0;
  });
  const toCheck = isInitializing ? initContainerStatuses : containerStatuses;
  return toCheck.reduce(
    (restartCount, status: ContainerStatus) => restartCount + status.restartCount,
    0,
  );
};

export const isContainerCrashLoopBackOff = (pod: Pod, containerName: string): boolean => {
  const containerStatus = pod?.status?.containerStatuses?.find((c) => c.name === containerName);
  const waitingReason = containerStatus?.state?.waiting?.reason;
  return waitingReason === 'CrashLoopBackOff';
};

export const isWindowsPod = (pod: Pod): boolean => {
  return pod?.spec?.tolerations?.some((t) => t.key === 'os' && t.value === 'Windows');
};

export const getMemoryUsageQuery = (namespace: string) =>
  `sum(container_memory_working_set_bytes{namespace='${namespace}',container=''}) BY (pod, namespace)`;
export const getCPUUsageQuery = (namespace: string) =>
  `pod:container_cpu_usage:sum{namespace='${namespace}'}`;

export const getPodCPUUsage = (cpuUsage: PrometheusResponse, pod: Pod) => {
  const podUsage = cpuUsage?.data?.result?.find(
    (result) =>
      result?.metric?.pod === getName(pod) && result?.metric?.namespace === getNamespace(pod),
  );

  return podUsage?.value?.[1];
};

export const getPodMemoryUsage = (memoryUsage: PrometheusResponse, pod: Pod) => {
  const podUsage = memoryUsage?.data?.result?.find(
    (result) =>
      result?.metric?.pod === getName(pod) && result?.metric?.namespace === getNamespace(pod),
  );

  return podUsage?.value?.[1];
};
