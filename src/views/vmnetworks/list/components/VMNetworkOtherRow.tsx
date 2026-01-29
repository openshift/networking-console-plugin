import React, { FC } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  getGroupVersionKindForResource,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';
import { NO_DATA_DASH } from '@utils/utils/constants';

import { OtherVMNetworkWithType } from '../types';
import { getVMNetworkTypeLabel } from '../utils';

type VMNetworkOtherRowType = RowProps<OtherVMNetworkWithType>;

const VMNetworkOtherRow: FC<VMNetworkOtherRowType> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();

  const name = getName(obj);
  const namespace = getNamespace(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForResource(obj)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        {namespace ? (
          <ResourceLink
            groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
            name={namespace}
          />
        ) : (
          NO_DATA_DASH
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="type">
        {getVMNetworkTypeLabel(obj.type, t)}
      </TableData>
    </>
  );
};

export default VMNetworkOtherRow;
