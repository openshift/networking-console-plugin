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
import { getName, getNamespace } from '@utils/resources/shared';
import { getType } from '@utils/resources/udns/selectors';
import { UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { UserDefinedNetworkModel } from '@utils/resources/udns/utils';
import UDNActions from '@views/udns/actions/UDNActions';

type UserDefinedNetworkRowType = RowProps<UserDefinedNetworkKind>;

const UserDefinedNetworkRow: FC<UserDefinedNetworkRowType> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const namespace = getNamespace(obj);
  const name = getName(obj);
  const type = getType(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(UserDefinedNetworkModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        <ResourceLink groupVersionKind={modelToGroupVersionKind(NamespaceModel)} name={namespace} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="type">
        {type || <MutedText content={t('Not available')} />}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="dropdown-kebab-pf pf-v5-c-table__action"
        id=""
      >
        <UDNActions obj={obj} />
      </TableData>
    </>
  );
};
export default UserDefinedNetworkRow;
