import React, { FC } from 'react';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import {
  ListPageBody,
  ListPageFilter,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups';
import { Flex } from '@patternfly/react-core';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import ListSkeleton from '@utils/components/ListEmptyState/ListSkeleton';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import useConnectedVMs from '../../../hooks/useConnectedVMs';

import useVirtualMachineActions from './actions/hooks/useVirtualMachineActions';
import useSelectedVMs from './hooks/useSelectedVMs';
import useVirtualMachineColumns from './hooks/useVirtualMachineColumns';
import ConnectedVirtualMachinesRow, {
  ConnectedVirtualMachinesRowData,
} from './ConnectedVirtualMachinesRow';

type ConnectedVirtualMachinesProps = {
  obj: ClusterUserDefinedNetworkKind;
};

const ConnectedVirtualMachines: FC<ConnectedVirtualMachinesProps> = ({ obj: vmNetwork }) => {
  const [vms, loadedVMs, error] = useConnectedVMs(vmNetwork);
  const [data, filteredData, onFilterChange] = useListPageFilter(vms);

  const { isSelected, onSelect, selectedVMs, setSelectedVMs } = useSelectedVMs();

  const [_, activeColumns, loadedColumns] = useVirtualMachineColumns();

  const actions = useVirtualMachineActions(selectedVMs, vmNetwork);

  const loaded = loadedVMs && loadedColumns;
  if (!loaded)
    return (
      <ListPageBody>
        <ListSkeleton />
      </ListPageBody>
    );

  return (
    <ListPageBody>
      <Flex>
        <BulkSelect
          onSelect={(value) => {
            if (value === BulkSelectValue.all || value === BulkSelectValue.page) {
              setSelectedVMs(vms);
            } else if (value === BulkSelectValue.none || value === BulkSelectValue.nonePage) {
              setSelectedVMs([]);
            }
          }}
          selectedCount={selectedVMs.length}
          totalCount={vms.length}
        />
        <ListPageFilter data={vms} loaded={loaded} onFilterChange={onFilterChange} />
        <ActionsDropdown actions={actions} id="vm-bulk-actions" isDisabled={isEmpty(selectedVMs)} />
      </Flex>
      <VirtualizedTable<V1VirtualMachine>
        columns={activeColumns}
        data={filteredData}
        loaded={loaded}
        loadError={error}
        Row={ConnectedVirtualMachinesRow}
        rowData={
          {
            isSelected,
            onSelect,
            vmNetwork,
          } as ConnectedVirtualMachinesRowData
        }
        unfilteredData={data}
      />
    </ListPageBody>
  );
};

export default ConnectedVirtualMachines;
