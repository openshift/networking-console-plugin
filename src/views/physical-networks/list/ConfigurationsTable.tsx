import React, { Dispatch, FC, SetStateAction } from 'react';

import { Button } from '@patternfly/react-core';
import { DataViewTable } from '@patternfly/react-data-view';
import type { DataViewTh, DataViewTr } from '@patternfly/react-data-view/dist/esm/DataViewTable';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NO_DATA_DASH } from '@utils/utils/constants';

import EnactmentStateIcon from '../details/EnactmentStateIcon';
import { ConfigurationDetails } from '../utils/types';

type ConfigurationsTableProps = {
  nncpDetails: ConfigurationDetails[];
  setSelectedConfiguration: Dispatch<SetStateAction<ConfigurationDetails>>;
};

const ConfigurationsTable: FC<ConfigurationsTableProps> = ({
  nncpDetails,
  setSelectedConfiguration,
}) => {
  const { t } = useNetworkingTranslation();

  const columns: DataViewTh[] = [
    { cell: t('Configuration'), props: { sort: { columnIndex: 0, sortBy: {} } } },
    { cell: t('Description'), props: { sort: { columnIndex: 1, sortBy: {} } } },
    { cell: t('Uplink'), props: { sort: { columnIndex: 2, sortBy: {} } } },
    {
      cell: t('MTU'),
      props: {
        info: {
          tooltip: t(
            'The largest size of a data packet, in bytes, that can be transmitted across this network. It is critical that the entire underlying physical network infrastructure also supports the same or larger MTU size to avoid packet fragmentation and connectivity issues.',
          ),
        },
        sort: { columnIndex: 3, sortBy: {} },
      },
    },
    { cell: t('Nodes'), props: { sort: { columnIndex: 4, sortBy: {} } } },
    { cell: t('Enactment state'), props: { sort: { columnIndex: 5, sortBy: {} } } },
  ];

  const rows: DataViewTr[] = nncpDetails.map((nncpDetail) => {
    const { configurationName, description, enactmentState, mtu, numNodes, uplink } = nncpDetail;

    return [
      {
        cell: (
          <Button isInline onClick={() => setSelectedConfiguration(nncpDetail)} variant="link">
            {configurationName}
          </Button>
        ),
      },
      description || NO_DATA_DASH,
      uplink || NO_DATA_DASH,
      mtu || NO_DATA_DASH,
      numNodes || NO_DATA_DASH,
      {
        cell: enactmentState ? <EnactmentStateIcon status={enactmentState} /> : NO_DATA_DASH,
      },
    ];
  });

  return (
    <DataViewTable aria-label={t('Configurations table')} columns={columns} rows={rows} />
  );
};

export default ConfigurationsTable;
