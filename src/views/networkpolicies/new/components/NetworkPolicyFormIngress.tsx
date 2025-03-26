import React, { FC } from 'react';

import {
  Button,
  ButtonVariant,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicy, NetworkPolicyRule } from '@utils/models';

import { NetworkPolicyEgressIngress } from '../utils/types';
import { emptyRule } from '../utils/utils';

import NetworkPolicyRuleConfigPanel from './NetworkPolicyRuleConfigPanel/NetworkPolicyRuleConfigPanel';

type NetworkPolicyFormIngressProps = {
  networkPolicy: NetworkPolicy;
  onPolicyChange: (policy: NetworkPolicy) => void;
  removeAll: (msg: string, execute: () => void) => void;
};

const NetworkPolicyFormIngress: FC<NetworkPolicyFormIngressProps> = ({
  networkPolicy,
  onPolicyChange,
  removeAll,
}) => {
  const { t } = useNetworkingTranslation();

  if (networkPolicy.ingress.denyAll) return null;

  const updateIngressRules = (rules: NetworkPolicyRule[]) =>
    onPolicyChange({
      ...networkPolicy,
      ingress: { ...networkPolicy.ingress, rules },
    });

  const addIngressRule = () => {
    updateIngressRules([emptyRule(), ...networkPolicy.ingress.rules]);
  };

  const removeAllIngress = () => {
    removeAll(
      t('This action will remove all rules within the Ingress section and cannot be undone.'),
      () => updateIngressRules([]),
    );
  };

  const removeIngressRule = (idx: number) => {
    updateIngressRules([
      ...networkPolicy.ingress.rules.slice(0, idx),
      ...networkPolicy.ingress.rules.slice(idx + 1),
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
                data-test="remove-all-ingress"
                isDisabled={networkPolicy.ingress.rules.length === 0}
                onClick={removeAllIngress}
                variant={ButtonVariant.link}
              >
                {t('Remove all')}
              </Button>
              <Button
                data-test="add-ingress"
                onClick={addIngressRule}
                variant={ButtonVariant.secondary}
              >
                {t('Add ingress rule')}
              </Button>
            </>
          }
          titleDescription={t(
            'Add ingress rules to be applied to your selected pods. Traffic is allowed from pods if it matches at least one rule.',
          )}
          titleText={{
            id: 'ingress-header',
            text: t('Ingress'),
          }}
        />
      }
      isExpanded
      toggleAriaLabel="Ingress"
    >
      {networkPolicy.ingress.rules.map((rule, idx) => (
        <NetworkPolicyRuleConfigPanel
          direction={NetworkPolicyEgressIngress.ingress}
          key={rule.key}
          onChange={(r) => {
            const newRules = [...networkPolicy.ingress.rules];
            newRules[idx] = r;
            updateIngressRules(newRules);
          }}
          onRemove={() => removeIngressRule(idx)}
          policyNamespace={networkPolicy.namespace}
          rule={rule}
        />
      ))}
    </FormFieldGroupExpandable>
  );
};

export default NetworkPolicyFormIngress;
