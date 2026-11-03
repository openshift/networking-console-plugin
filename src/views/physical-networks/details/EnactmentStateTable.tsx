import React, { FC } from 'react';
import { Link } from 'react-router';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { DataViewTable } from '@patternfly/react-data-view';
import type { DataViewTh, DataViewTr } from '@patternfly/react-data-view/dist/esm/DataViewTable';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NodeModel, NodeModelGroupVersionKind } from '@utils/models';
import { getResourceURL } from '@utils/resources/shared';
import { NO_DATA_DASH } from '@utils/utils/constants';

import { NodeEnactmentStateDetails } from '../utils/types';

import EnactmentStateIcon from './EnactmentStateIcon';

type EnactmentStateTableProps = {
  nodeEnactmentStateDetails: NodeEnactmentStateDetails[];
};

const EnactmentStateTable: FC<EnactmentStateTableProps> = ({ nodeEnactmentStateDetails }) => {
  const { t } = useNetworkingTranslation();

  const columns: DataViewTh[] = [
    {
      cell: t('Nodes'),
      key: 'node.metadata.name',
      props: { sort: { columnIndex: 0, sortBy: {} } },
    },
    { cell: t('State'), key: 'status', props: { sort: { columnIndex: 1, sortBy: {} } } },
  ];

  const rows: DataViewTr[] = nodeEnactmentStateDetails.map(({ node, status }) => [
    {
      cell: node ? (
        <>
          <ResourceIcon groupVersionKind={NodeModelGroupVersionKind} />
          <Link to={getResourceURL({ model: NodeModel, resource: node })}>
            {node?.metadata?.name}
          </Link>
        </>
      ) : (
        NO_DATA_DASH
      ),
    },
    { cell: status ? <EnactmentStateIcon status={status} /> : NO_DATA_DASH },
  ]);

  return <DataViewTable aria-label={t('Enactment state table')} columns={columns} rows={rows} />;
};

export default EnactmentStateTable;
