import React, { FC } from 'react';

import {
  Button,
  ButtonVariant,
  Divider,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicyPeer, NetworkPolicyRule } from '@utils/models';
import NetworkPolicyPeerIPBlock from '@views/networkpolicies/new/NetworkPolicyPeerIPBlock';
import NetworkPolicyPeerSelectors from '@views/networkpolicies/new/NetworkPolicyPeerSelectors';
import { NetworkPolicyEgressIngress } from '@views/networkpolicies/new/utils/types';
import { getPeerRuleTitle } from '@views/networkpolicies/new/utils/utils';

type NetworkPolicyRuleConfigPanelRulePeerProps = {
  direction: NetworkPolicyEgressIngress;
  index: number;
  onChange: (rule: NetworkPolicyRule) => void;
  peer: NetworkPolicyPeer;
  policyNamespace: string;
  rule: NetworkPolicyRule;
};
const NetworkPolicyRuleConfigPanelRulePeer: FC<NetworkPolicyRuleConfigPanelRulePeerProps> = ({
  direction,
  index,
  onChange,
  peer,
  policyNamespace,
  rule,
}) => {
  const { t } = useNetworkingTranslation();

  const removePeer = (idx: number) => {
    rule.peers = [...rule.peers.slice(0, idx), ...rule.peers.slice(idx + 1)];
    onChange(rule);
  };

  const peerPanel = peer.ipBlock ? (
    <NetworkPolicyPeerIPBlock
      direction={direction}
      ipBlock={peer.ipBlock}
      onChange={(ipBlock) => {
        rule.peers[index].ipBlock = ipBlock;
        onChange(rule);
      }}
    />
  ) : (
    <NetworkPolicyPeerSelectors
      direction={direction}
      namespaceSelector={peer.namespaceSelector}
      onChange={(podSel, nsSel) => {
        rule.peers[index].podSelector = podSel;
        rule.peers[index].namespaceSelector = nsSel;
        onChange(rule);
      }}
      podSelector={peer.podSelector || []}
      policyNamespace={policyNamespace}
    />
  );
  return (
    <div className="form-group" key={peer.key}>
      <FormFieldGroupExpandable
        header={
          <FormFieldGroupHeader
            actions={
              <Button
                aria-label={t('Remove peer')}
                className="co-create-networkpolicy__remove-peer"
                data-test="remove-peer"
                icon={<TrashIcon />}
                onClick={() => removePeer(index)}
                variant={ButtonVariant.plain}
              />
            }
            style={{ paddingBlockStart: '1rem' }}
            titleText={{
              id: `peer-header-${index}`,
              text: getPeerRuleTitle(direction, peer),
            }}
          />
        }
        isExpanded
        toggleAriaLabel="Peer"
      >
        {peerPanel}
      </FormFieldGroupExpandable>
      <Divider />
    </div>
  );
};

export default NetworkPolicyRuleConfigPanelRulePeer;
