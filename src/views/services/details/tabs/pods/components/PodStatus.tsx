import React, { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { PodModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  IoK8sApiCoreV1Container,
  IoK8sApiCoreV1Pod,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { Button, Divider, Popover, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { resourcePathFromModel } from '@utils/resources/shared';

import { isContainerCrashLoopBackOff, isWindowsPod, podPhase } from '../utils';

type PodStatusPopoverProps = {
  bodyContent: string;
  footerContent?: ReactNode | string;
  headerContent?: string;
  status: string;
};

export type PodStatusProps = {
  pod: IoK8sApiCoreV1Pod;
};

const PodStatusPopover: FC<PodStatusPopoverProps> = ({
  bodyContent,
  footerContent,
  headerContent,
  status,
}) => {
  return (
    <Popover bodyContent={bodyContent} footerContent={footerContent} headerContent={headerContent}>
      <Button data-test="popover-status-button" isInline variant="link">
        <Status status={status} />
      </Button>
    </Popover>
  );
};

export const PodStatus: FC<PodStatusProps> = ({ pod }) => {
  const status = podPhase(pod);
  const unschedulableCondition = pod.status?.conditions?.find(
    (condition) => condition.reason === 'Unschedulable' && condition.status === 'False',
  );
  const containerStatusStateWaiting = pod.status?.containerStatuses?.find(
    (cs) => cs.state?.waiting,
  );
  const { t } = useNetworkingTranslation();

  if (status === 'Pending' && unschedulableCondition) {
    return (
      <PodStatusPopover
        bodyContent={unschedulableCondition.message}
        headerContent={t('Pod unschedulable')}
        status={status}
      />
    );
  }
  if (
    (status === 'CrashLoopBackOff' || status === 'ErrImagePull' || status === 'ImagePullBackOff') &&
    containerStatusStateWaiting
  ) {
    let footerLinks: ReactNode;
    let headerTitle = '';
    if (status === 'CrashLoopBackOff') {
      headerTitle = t('Pod crash loop back-off');
      const containers: IoK8sApiCoreV1Container[] = pod.spec.containers;
      footerLinks = (
        <TextContent>
          <Text component={TextVariants.p}>
            {t(
              'CrashLoopBackOff indicates that the application within the container is failing to start properly.',
            )}
          </Text>
          <Text component={TextVariants.p}>
            {t('To troubleshoot, view logs and events, then debug in terminal.')}
          </Text>
          <Text component={TextVariants.p}>
            <Link
              to={`${resourcePathFromModel(PodModel, pod.metadata.name, pod.metadata.namespace)}/logs`}
            >
              {t('View logs')}
            </Link>
            &emsp;
            <Link
              to={`${resourcePathFromModel(PodModel, pod.metadata.name, pod.metadata.namespace)}/events`}
            >
              {t('View events')}
            </Link>
          </Text>
          <Divider />
          {containers.map((container) => {
            if (isContainerCrashLoopBackOff(pod, container.name) && !isWindowsPod(pod)) {
              return (
                <div key={container.name}>
                  <Link
                    data-test={`popup-debug-container-link-${container.name}`}
                    to={`${resourcePathFromModel(
                      PodModel,
                      pod.metadata.name,
                      pod.metadata.namespace,
                    )}/containers/${container.name}/debug`}
                  >
                    {t('Debug container {{name}}', { name: container.name })}
                  </Link>
                </div>
              );
            }
          })}
        </TextContent>
      );
    }

    return (
      <PodStatusPopover
        bodyContent={containerStatusStateWaiting.state.waiting.message}
        footerContent={footerLinks}
        headerContent={headerTitle}
        status={status}
      />
    );
  }

  return <Status status={status} />;
};
