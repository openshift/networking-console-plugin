import React, { FC } from 'react';
import { Link } from 'react-router';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { DataViewTable } from '@patternfly/react-data-view';
import type { DataViewTh, DataViewTr } from '@patternfly/react-data-view/dist/esm/DataViewTable';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NodeModel, NodeModelGroupVersionKind } from '@utils/models';
import { getResourceURL } from '@utils/resources/shared';
import { NO_DATA_DASH } from '@utils/utils/constants';

import { ObservedMapping } from '../utils/types';

type ObservedMappingsTableProps = {
  observedMappings: ObservedMapping[];
};

const ObservedMappingsTable: FC<ObservedMappingsTableProps> = ({ observedMappings }) => {
  const { t } = useNetworkingTranslation();

  const columns: DataViewTh[] = [
    { cell: t('Node'), props: { sort: { columnIndex: 0, sortBy: {} } } },
    { cell: t('Bridge'), props: { sort: { columnIndex: 1, sortBy: {} } } },
  ];

  const rows: DataViewTr[] = observedMappings.map(({ bridge, node, nodeName }) => [
    {
      cell: node ? (
        <>
          <ResourceIcon groupVersionKind={NodeModelGroupVersionKind} />
          <Link to={getResourceURL({ model: NodeModel, resource: node })}>{nodeName}</Link>
        </>
      ) : (
        nodeName
      ),
    },
    bridge || NO_DATA_DASH,
  ]);

  return <DataViewTable aria-label={t('Observed mappings table')} columns={columns} rows={rows} />;
};

export default ObservedMappingsTable;
