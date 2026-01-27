import React, { FC } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ResourceLink, RowProps, TableData } from '@openshift-console/dynamic-plugin-sdk';
import { Checkbox, Flex } from '@patternfly/react-core';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { getName, getNamespace } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { getVMStatus } from '@utils/resources/vm/selectors';

import useVirtualMachineActions from './actions/hooks/useVirtualMachineActions';

export type ConnectedVirtualMachinesRowData = {
  isSelected: (vm: V1VirtualMachine) => boolean;
  onSelect: (vm: V1VirtualMachine) => void;
  vmNetwork: ClusterUserDefinedNetworkKind;
};

const ConnectedVirtualMachinesRow: FC<
  RowProps<V1VirtualMachine, ConnectedVirtualMachinesRowData>
> = ({ activeColumnIDs, obj, rowData: { isSelected, onSelect, vmNetwork } }) => {
  const actions = useVirtualMachineActions([obj], vmNetwork);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} className="pf-v6-c-table__action" id="">
        <Flex justifyContent={{ default: 'justifyContentCenter' }}>
          <Checkbox
            className="pf-v6-u-pt-sm"
            id={`select-${obj?.metadata?.uid}`}
            isChecked={isSelected(obj)}
            onChange={() => onSelect(obj)}
          />
        </Flex>
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(VirtualMachineModel)}
          name={getName(obj)}
          namespace={getNamespace(obj)}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
          name={getNamespace(obj)}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="status">
        {getVMStatus(obj)}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className="pf-v6-c-table__action" id="">
        <ActionsDropdown actions={actions} id="vm-actions" isKebabToggle />
      </TableData>
    </>
  );
};

export default ConnectedVirtualMachinesRow;
