import React, { FC, MutableRefObject } from 'react';

import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Popover } from '@patternfly/react-core';

import SelectorPreviewContent from './SelectorPreviewContent';

export type SelectorPreviewProps = {
  dataTest?: string;
  labelSelector?: string[][];
  namespace?: string;
  popoverRef: MutableRefObject<HTMLElement | undefined>;
  resourceModel: K8sModel;
  resourceName: string;
};

/**
 * Popover preview of K8s resources matching a label selector.
 * Resource-type agnostic — pass any K8sModel (Pod, Project, etc.).
 */
const SelectorPreview: FC<SelectorPreviewProps> = ({
  dataTest,
  labelSelector,
  namespace,
  popoverRef,
  resourceModel,
  resourceName,
}) => (
  <Popover
    aria-label={dataTest ? `${dataTest}-list` : 'matching-resources-list'}
    bodyContent={
      <SelectorPreviewContent
        labelSelector={labelSelector}
        namespace={namespace}
        resourceModel={resourceModel}
        resourceName={resourceName}
      />
    }
    data-test={dataTest ? `${dataTest}-popover` : 'selector-preview-popover'}
    position="bottom"
    triggerRef={popoverRef}
  />
);

export default SelectorPreview;
