import React, { FC } from 'react';

import {
  Button,
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
                icon={<TrashIcon />}
                aria-label={t('Remove peer')}
                className="co-create-networkpolicy__remove-peer"
                data-test="remove-peer"
                onClick={() => removePeer(index)}
                type="button"
                variant="plain"
              />
            }
            titleText={{
              id: `peer-header-${index}`,
              text: getPeerRuleTitle(direction, peer),
            }}
            style={{ paddingBlockStart: '1rem' }}
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
