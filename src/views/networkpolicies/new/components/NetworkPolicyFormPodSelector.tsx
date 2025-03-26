import React, { FC, useRef } from 'react';
import { Trans } from 'react-i18next';

import { Button, ButtonVariant } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicy } from '@utils/models';

import NetworkPolicyConditionalSelector from '../NetworkPolicyConditionalSelector';

import NetworkPolicySelectorPreview from './NetworkPolicySelectorPreview/NetworkPolicySelectorPreview';

type NetworkPolicyFormPodSelectorProps = {
  networkPolicy: NetworkPolicy;
  onPolicyChange: (policy: NetworkPolicy) => void;
};

const NetworkPolicyFormPodSelector: FC<NetworkPolicyFormPodSelectorProps> = ({
  networkPolicy,
  onPolicyChange,
}) => {
  const { t } = useNetworkingTranslation();
  const podsPreviewPopoverRef = useRef();

  const handleMainPodSelectorChange = (updated: string[][]) => {
    onPolicyChange({ ...networkPolicy, podSelector: updated });
  };

  return (
    <div>
      <NetworkPolicyConditionalSelector
        dataTest="main-pod-selector"
        helpText={t(
          'If no pod selector is provided, the policy will apply to all pods in the namespace.',
        )}
        onChange={handleMainPodSelectorChange}
        selectorType="pod"
        values={networkPolicy.podSelector}
      />
      <p className="pf-v6-u-mt-sm">
        <Trans t={t}>
          Show a preview of the{' '}
          <Button
            data-test="show-affected-pods"
            isInline
            ref={podsPreviewPopoverRef}
            variant={ButtonVariant.link}
          >
            affected pods
          </Button>{' '}
          that this policy will apply to
        </Trans>
      </p>
      <NetworkPolicySelectorPreview
        dataTest="policy-pods-preview"
        podSelector={networkPolicy.podSelector}
        policyNamespace={networkPolicy.namespace}
        popoverRef={podsPreviewPopoverRef}
      />
    </div>
  );
};

export default NetworkPolicyFormPodSelector;
