import React, { FC } from 'react';
import { Link } from 'react-router';

import { NetworkAttachmentDefinitionModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { Button } from '@patternfly/react-core';
import { DataViewTable } from '@patternfly/react-data-view';
import type { DataViewTh, DataViewTr } from '@patternfly/react-data-view/dist/esm/DataViewTable';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getResourceURL } from '@utils/resources/shared';
import { NO_DATA_DASH } from '@utils/utils/constants';

import { ConsumersAvailability, LocalnetNAD, PhysicalNetworkConsumer } from '../utils/types';

type NetworkDefinitionsTableProps = {
  consumersAvailability: ConsumersAvailability;
  consumersByNAD: Record<string, PhysicalNetworkConsumer[]>;
  nads: LocalnetNAD[];
  networkName: string;
  onShowConsumers: (nad: LocalnetNAD, networkName: string) => void;
};

const NetworkDefinitionsTable: FC<NetworkDefinitionsTableProps> = ({
  consumersAvailability,
  consumersByNAD,
  nads,
  networkName,
  onShowConsumers,
}) => {
  const { t } = useNetworkingTranslation();

  const getColumns = (): DataViewTh[] => [
    { cell: t('Name'), props: { sort: { columnIndex: 0, sortBy: {} } } },
    { cell: t('Namespace'), props: { sort: { columnIndex: 1, sortBy: {} } } },
    { cell: t('VLAN'), props: { sort: { columnIndex: 2, sortBy: {} } } },
    { cell: t('MTU'), props: { sort: { columnIndex: 3, sortBy: {} } } },
    { cell: t('Consumers'), props: { sort: { columnIndex: 4, sortBy: {} } } },
  ];

  const getConsumersCell = (nad: LocalnetNAD) => {
    if (consumersAvailability === 'unavailable') {
      return t('Unavailable');
    }

    const count = consumersByNAD[`${nad.namespace}/${nad.name}`]?.length ?? 0;
    const label = t('{{count}} consumers', { count });

    return (
      <>
        <Button isInline onClick={() => onShowConsumers(nad, networkName)} variant="link">
          {label}
        </Button>
        {consumersAvailability === 'partial' && ` ${t('(incomplete)')}`}
      </>
    );
  };

  const rows: DataViewTr[] = nads.map((nad) => [
    {
      cell: (
        <Link to={getResourceURL({ model: NetworkAttachmentDefinitionModel, resource: nad.nad })}>
          {nad.name}
        </Link>
      ),
    },
    nad.namespace || NO_DATA_DASH,
    nad.vlan || NO_DATA_DASH,
    nad.mtu || NO_DATA_DASH,
    { cell: getConsumersCell(nad) },
  ]);

  return (
    <DataViewTable aria-label={t('Network definitions table')} columns={getColumns()} rows={rows} />
  );
};

export default NetworkDefinitionsTable;
