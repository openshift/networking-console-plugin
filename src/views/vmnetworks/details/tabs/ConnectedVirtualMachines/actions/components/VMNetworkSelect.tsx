import React, { FC } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { Alert, AlertVariant, DropdownItem, Skeleton } from '@patternfly/react-core';
import Select from '@utils/components/Select/Select';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import useSelectableVMNetworksWithProjects from '../hooks/useSelectableVMNetworksWithProjects';
import { VMNetworkWithProjects } from '../types';

export type VMNetworkSelectProps = {
  currentNetwork: string;
  onSelect: (newSelection: VMNetworkWithProjects) => void;
  selectedNetwork: string;
  vms: V1VirtualMachine[];
};

const VMNetworkSelect: FC<VMNetworkSelectProps> = ({
  currentNetwork,
  onSelect,
  selectedNetwork,
  vms,
}) => {
  const { t } = useNetworkingTranslation();
  const [vmNetworksWithProjects, loaded, error] = useSelectableVMNetworksWithProjects(
    currentNetwork,
    vms,
  );

  if (!loaded) return <Skeleton />;

  if (error)
    return (
      <Alert title={t('Error')} variant={AlertVariant.danger}>
        {error.message ?? t('Error loading networks')}
      </Alert>
    );

  return (
    <Select
      id="vm-network-select"
      selected={selectedNetwork}
      toggleContent={selectedNetwork ?? t('Select a virtual machine network')}
    >
      {isEmpty(vmNetworksWithProjects) ? (
        <DropdownItem isDisabled key="no-networks" value="no-networks">
          {t('No other networks available')}
        </DropdownItem>
      ) : (
        vmNetworksWithProjects.map(({ projectNames, vmNetworkName }) => (
          <DropdownItem
            key={vmNetworkName}
            onClick={() => onSelect({ projectNames, vmNetworkName })}
            value={vmNetworkName}
          >
            {vmNetworkName}
          </DropdownItem>
        ))
      )}
    </Select>
  );
};

export default VMNetworkSelect;
