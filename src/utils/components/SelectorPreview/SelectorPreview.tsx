import React, { FC, MutableRefObject } from 'react';

import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Popover } from '@patternfly/react-core';

import SelectorPreviewContent from './SelectorPreviewContent';

export type SelectorPreviewProps = {
  dataTest?: string;
  labelSelector?: string[][];
  namespace?: string;
  namespaceSelector?: string[][];
  popoverRef: MutableRefObject<HTMLElement | undefined>;
  resourceModel: K8sModel;
};

/**
 * Popover preview of K8s resources matching a label selector.
 * Resource-type agnostic — pass any K8sModel (Pod, Project, etc.).
 */
const SelectorPreview: FC<SelectorPreviewProps> = ({
  dataTest,
  labelSelector,
  namespace,
  namespaceSelector,
  popoverRef,
  resourceModel,
}) => (
  <Popover
    aria-label={dataTest ? `${dataTest}-list` : 'matching-resources-list'}
    bodyContent={
      <SelectorPreviewContent
        labelSelector={labelSelector}
        namespace={namespace}
        namespaceSelector={namespaceSelector}
        resourceModel={resourceModel}
      />
    }
    data-test={dataTest ? `${dataTest}-popover` : 'selector-preview-popover'}
    position="bottom"
    triggerRef={popoverRef}
  />
);

export default SelectorPreview;
