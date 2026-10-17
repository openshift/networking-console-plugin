import * as _ from 'lodash';

import { IoK8sApiCoreV1Pod } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { RowFilter } from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { podPhaseFilterReducer } from '../utils';

export const usePodFilters = (): RowFilter<IoK8sApiCoreV1Pod>[] => {
  const { t } = useNetworkingTranslation();

  return [
    {
      filter: (phases, pod) => {
        if (!phases || !phases.selected || !phases.selected.length) {
          return true;
        }
        const phase = podPhaseFilterReducer(pod);
        return phases.selected.includes(phase) || !_.includes(phases.all, phase);
      },
      filterGroupName: t('Status'),
      items: [
        { id: 'Running', title: t('Running') },
        { id: 'Pending', title: t('Pending') },
        { id: 'Terminating', title: t('Terminating') },
        { id: 'CrashLoopBackOff', title: t('CrashLoopBackOff') },
        // Use title "Completed" to match what appears in the status column for the pod.
        // The pod phase is "Succeeded," but the container state is "Completed."
        { id: 'Succeeded', title: t('Completed') },
        { id: 'Failed', title: t('Failed') },
        { id: 'Unknown', title: t('Unknown') },
      ],
      reducer: podPhaseFilterReducer,
      type: 'pod-status',
    },
  ];
};
