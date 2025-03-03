import React, { FC } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { Badge } from '@patternfly/react-core';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isUserDefinedNetworkNAD } from '@utils/resources/nads/helpers';
import { getConfigAsJSON, getType } from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName, getNamespace } from '@utils/resources/shared';
import NADsActions from '@views/nads/actions/NADActions';

type NADsRowType = RowProps<NetworkAttachmentDefinitionKind>;

const NADsRow: FC<NADsRowType> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();
  const namespace = getNamespace(obj);
  const name = getName(obj);

  const type = getType(getConfigAsJSON(obj));
  const isUDNManaged = isUserDefinedNetworkNAD(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(NetworkAttachmentDefinitionModel)}
          inline
          name={name}
          namespace={namespace}
        />

        {isUDNManaged && <Badge>{t('UserDefinedNetwork')}</Badge>}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        <ResourceLink groupVersionKind={modelToGroupVersionKind(NamespaceModel)} name={namespace} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="type">
        {type || <MutedText content={t('Not available')} />}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="dropdown-kebab-pf pf-v6-c-table__action"
        id=""
      >
        <NADsActions obj={obj} />
      </TableData>
    </>
  );
};
export default NADsRow;
