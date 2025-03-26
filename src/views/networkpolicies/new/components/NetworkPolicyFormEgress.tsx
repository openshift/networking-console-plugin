import React, { FC } from 'react';

import {
  Button,
  ButtonVariant,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
} from '@patternfly/react-core';
import { ClusterNetworkFeatures } from '@utils/hooks/useClusterNetworkFeatures';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicy, NetworkPolicyRule } from '@utils/models';

import { NetworkPolicyEgressIngress } from '../utils/types';
import { emptyRule } from '../utils/utils';

import NetworkPolicyRuleConfigPanel from './NetworkPolicyRuleConfigPanel/NetworkPolicyRuleConfigPanel';

type NetworkPolicyFormEgressProps = {
  networkFeatures: ClusterNetworkFeatures;
  networkFeaturesLoaded: boolean;
  networkPolicy: NetworkPolicy;
  onPolicyChange: (policy: NetworkPolicy) => void;
  removeAll: (msg: string, execute: () => void) => void;
};

const NetworkPolicyFormEgress: FC<NetworkPolicyFormEgressProps> = ({
  networkFeatures,
  networkFeaturesLoaded,
  networkPolicy,
  onPolicyChange,
  removeAll,
}) => {
  const { t } = useNetworkingTranslation();

  if (
    networkPolicy.egress.denyAll &&
    networkFeaturesLoaded &&
    networkFeatures.PolicyEgress !== false
  )
    return null;

  const updateEgressRules = (rules: NetworkPolicyRule[]) =>
    onPolicyChange({
      ...networkPolicy,
      egress: { ...networkPolicy.egress, rules },
    });

  const removeAllEgress = () => {
    removeAll(
      t('This action will remove all rules within the Egress section and cannot be undone.'),
      () => updateEgressRules([]),
    );
  };

  const addEgressRule = () => {
    updateEgressRules([emptyRule(), ...networkPolicy.egress.rules]);
  };

  const removeEgressRule = (idx: number) => {
    updateEgressRules([
      ...networkPolicy.egress.rules.slice(0, idx),
      ...networkPolicy.egress.rules.slice(idx + 1),
    ]);
  };

  return (
    <FormFieldGroupExpandable
      className="co-create-networkpolicy__expandable-xl"
      header={
        <FormFieldGroupHeader
          actions={
            <>
              <Button
                className="pf-v6-u-mr-sm"
                data-test="remove-all-egress"
                isDisabled={networkPolicy.egress.rules.length === 0}
                onClick={removeAllEgress}
                variant={ButtonVariant.link}
              >
                {t('Remove all')}
              </Button>
              <Button
                data-test="add-egress"
                onClick={addEgressRule}
                variant={ButtonVariant.secondary}
              >
                {t('Add egress rule')}
              </Button>
            </>
          }
          titleDescription={t(
            'Add egress rules to be applied to your selected pods. Traffic is allowed to pods if it matches at least one rule.',
          )}
          titleText={{
            id: 'egress-header',
            text: t('Egress'),
          }}
        />
      }
      isExpanded
      toggleAriaLabel="Egress"
    >
      {networkPolicy.egress.rules.map((rule, idx) => (
        <NetworkPolicyRuleConfigPanel
          direction={NetworkPolicyEgressIngress.egress}
          key={rule.key}
          onChange={(r) => {
            const newRules = [...networkPolicy.egress.rules];
            newRules[idx] = r;
            updateEgressRules(newRules);
          }}
          onRemove={() => removeEgressRule(idx)}
          policyNamespace={networkPolicy.namespace}
          rule={rule}
        />
      ))}
    </FormFieldGroupExpandable>
  );
};

export default NetworkPolicyFormEgress;
