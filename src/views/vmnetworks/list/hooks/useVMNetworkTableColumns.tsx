import React, { useMemo } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { ColumnConfig } from '@utils/components/KubevirtTable/types';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { getLocalnet, getMTU, getVLANID } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { NO_DATA_DASH } from '@utils/utils/constants';
import VMNetworkAction from '@views/vmnetworks/actions/VMNetworkActions';
import { VM_NETWORKS_PATH } from '@views/vmnetworks/constants';

import MatchedProjects from '../components/MatchedProjects';

const useVMNetworkTableColumns = (): ColumnConfig<ClusterUserDefinedNetworkKind>[] => {
  const { t } = useNetworkingTranslation();

  return useMemo(
    (): ColumnConfig<ClusterUserDefinedNetworkKind>[] => [
      {
        getValue: (row) => getName(row) ?? '',
        key: 'name',
        label: t('Name'),
        props: { className: 'pf-m-width-20' },
        renderCell: (row) => {
          const name = getName(row);
          return <Link to={`${VM_NETWORKS_PATH}/${name}`}>{name}</Link>;
        },
        sortable: true,
      },
      {
        key: 'connected-projects',
        label: t('Connected projects'),
        props: { className: 'pf-m-width-25' },
        renderCell: (row) => <MatchedProjects obj={row} />,
      },
      {
        getValue: (row) => getLocalnet(row)?.physicalNetworkName ?? '',
        key: 'physicalNetworkName',
        label: t('Physical network name'),
        props: { className: 'pf-m-width-20' },
        renderCell: (row) => getLocalnet(row)?.physicalNetworkName || NO_DATA_DASH,
        sortable: true,
      },
      {
        getValue: (row) => getVLANID(row) ?? 0,
        key: 'vlanID',
        label: t('VLAN ID'),
        props: { className: 'pf-m-width-15' },
        renderCell: (row) => getVLANID(row) ?? NO_DATA_DASH,
        sortable: true,
      },
      {
        getValue: (row) => getMTU(row) ?? 0,
        key: 'mtu',
        label: t('MTU'),
        props: { className: 'pf-m-width-15' },
        renderCell: (row) => {
          const mtu = getMTU(row);
          return mtu || <MutedText content={t('Not available')} />;
        },
        sortable: true,
      },
      {
        key: 'actions',
        label: '',
        props: { className: 'pf-v6-c-table__action' },
        renderCell: (row) => <VMNetworkAction obj={row} />,
      },
    ],
    [t],
  );
};

export default useVMNetworkTableColumns;
