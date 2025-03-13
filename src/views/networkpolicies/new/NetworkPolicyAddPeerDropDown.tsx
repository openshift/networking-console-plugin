import React, { FC, Ref, useState } from 'react';

import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { NetworkPolicyPeerType } from './utils/types';

type NetworkPolicyAddPeerDropdownProps = {
  onSelect: (type: NetworkPolicyPeerType) => void;
  title: string;
};

const NetworkPolicyAddPeerDropdown: FC<NetworkPolicyAddPeerDropdownProps> = (props) => {
  const { t } = useNetworkingTranslation();
  const { onSelect, title } = props;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="form-group co-create-networkpolicy__add-peer pf-v6-u-mt-sm">
      <Dropdown
        data-test="add-peer"
        isOpen={isDropdownOpen}
        onSelect={(_event, networkType: NetworkPolicyPeerType) => {
          onSelect(networkType);
          setIsDropdownOpen(false);
        }}
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            id="toggle-basic"
            isExpanded={isDropdownOpen}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            ref={toggleRef}
          >
            {title}
          </MenuToggle>
        )}
      >
        <DropdownList className="add-peer-dropdown">
          <DropdownItem value="sameNS">{t('Allow pods from the same namespace')}</DropdownItem>
          <DropdownItem value="anyNS">{t('Allow pods from inside the cluster')}</DropdownItem>
          <DropdownItem value="ipblock">{t('Allow peers by IP block')}</DropdownItem>
        </DropdownList>
      </Dropdown>
    </div>
  );
};

export default NetworkPolicyAddPeerDropdown;
