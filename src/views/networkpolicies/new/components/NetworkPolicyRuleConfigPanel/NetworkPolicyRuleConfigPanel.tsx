import React, { FC } from 'react';

import { Button, ButtonVariant, Card, CardBody, CardTitle } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicyRule } from '@utils/models';

import NetworkPolicyAddPeerDropdown from '../../NetworkPolicyAddPeerDropDown';
import { NetworkPolicyEgressIngress, NetworkPolicyPeerType } from '../../utils/types';
import { emptyPeer } from '../../utils/utils';
import NetworkPolicyPorts from '../NetworkPolicyFormPorts';

import NetworkPolicyRuleConfigPanelRulePeer from './components/NetworkPolicyRuleConfigPanelRulePeer';
import { getPeersHelpText } from './utils/utils';

type NetworkPolicyRuleConfigPanelProps = {
  direction: NetworkPolicyEgressIngress;
  onChange: (rule: NetworkPolicyRule) => void;
  onRemove: () => void;
  policyNamespace: string;
  rule: NetworkPolicyRule;
};

const NetworkPolicyRuleConfigPanel: FC<NetworkPolicyRuleConfigPanelProps> = ({
  direction,
  onChange,
  onRemove,
  policyNamespace,
  rule,
}) => {
  const { t } = useNetworkingTranslation();

  const addPeer = (type: NetworkPolicyPeerType) => {
    rule.peers = [emptyPeer(type), ...rule.peers];
    onChange(rule);
  };
  const isIngress = direction === NetworkPolicyEgressIngress.ingress;
  return (
    <Card>
      <CardTitle component="h4">
        <label>{isIngress ? t('Ingress rule') : t('Egress rule')}</label>
        <Button
          className="pf-v6-u-ml-sm"
          data-test={`remove-${direction}-rule`}
          onClick={onRemove}
          variant={ButtonVariant.link}
        >
          {t('Remove')}
        </Button>
        <NetworkPolicyAddPeerDropdown
          onSelect={addPeer}
          title={isIngress ? t('Add allowed source') : t('Add allowed destination')}
        />
      </CardTitle>
      <CardBody>
        <div className="help-block" id="ingress-peers-help">
          <p>{getPeersHelpText(direction)}</p>
        </div>
      </CardBody>
      <CardBody>
        {rule.peers.map((peer, index) => (
          <NetworkPolicyRuleConfigPanelRulePeer
            direction={direction}
            index={index}
            key={peer.key}
            onChange={onChange}
            peer={peer}
            policyNamespace={policyNamespace}
            rule={rule}
          />
        ))}
        <NetworkPolicyPorts
          onChange={(ports) => {
            rule.ports = ports;
            onChange(rule);
          }}
          ports={rule.ports}
        />
      </CardBody>
    </Card>
  );
};

export default NetworkPolicyRuleConfigPanel;
