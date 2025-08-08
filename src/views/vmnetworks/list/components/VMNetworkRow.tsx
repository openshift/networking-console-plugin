import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { RowProps, TableData } from '@openshift-console/dynamic-plugin-sdk';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { getMTU } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { NO_DATA_DASH } from '@utils/utils/constants';
import VMNetworkAction from '@views/vmnetworks/actions/VMNetworkActions';

import MatchedProjects from './MatchedProjects';

type VMNetworkRowType = RowProps<ClusterUserDefinedNetworkKind>;

const VMNetworkRow: FC<VMNetworkRowType> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const name = getName(obj);
  const mtu = getMTU(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <Link to={`/k8s/cluster/virtualmachine-networks/${name}`}>{name}</Link>
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespaces">
        <MatchedProjects obj={obj} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="physicalNetworkName">
        {obj?.spec?.network?.localnet?.physicalNetworkName || NO_DATA_DASH}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="mtu">
        {mtu || <MutedText content={t('Not available')} />}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className="pf-v6-c-table__action" id="">
        <VMNetworkAction obj={obj} />
      </TableData>
    </>
  );
};
export default VMNetworkRow;
