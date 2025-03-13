import React, { FC } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { UserDefinedNetworkModel } from '@utils/models';
import { getName, getNamespace } from '@utils/resources/shared';
import { getModel, getMTU, getTopology } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { NO_DATA_DASH } from '@utils/utils/constants';
import UDNActions from '@views/udns/actions/UDNActions';

type UserDefinedNetworkRowType = RowProps<ClusterUserDefinedNetworkKind | UserDefinedNetworkKind>;

const UserDefinedNetworkRow: FC<UserDefinedNetworkRowType> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const namespace = getNamespace(obj);
  const name = getName(obj);
  const topology = getTopology(obj);
  const model = getModel(obj);

  const mtu = getMTU(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(model)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        {model === UserDefinedNetworkModel ? (
          <ResourceLink
            groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
            name={namespace}
          />
        ) : (
          NO_DATA_DASH
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="topology">
        {topology || <MutedText content={t('Not available')} />}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="mtu">
        {mtu || <MutedText content={t('Not available')} />}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="dropdown-kebab-pf pf-v6-c-table__action"
        id=""
      >
        <UDNActions obj={obj} />
      </TableData>
    </>
  );
};
export default UserDefinedNetworkRow;
