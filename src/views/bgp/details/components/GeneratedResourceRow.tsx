import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
import type { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { ResourceLink, RowProps, TableData } from '@openshift-console/dynamic-plugin-sdk';
import { FRRConfigurationModel } from '@utils/models';
import { getName, getNamespace } from '@utils/resources/shared';

export type GeneratedResourceRowProps = {
  model: typeof FRRConfigurationModel;
} & RowProps<K8sResourceKind>;

const GeneratedResourceRow: FC<GeneratedResourceRowProps> = ({ activeColumnIDs, model, obj }) => (
  <>
    <TableData activeColumnIDs={activeColumnIDs} id="name">
      <ResourceLink
        groupVersionKind={modelToGroupVersionKind(model)}
        name={getName(obj)}
        namespace={model.namespaced ? getNamespace(obj) : undefined}
      />
    </TableData>
    {model.namespaced && (
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        {getNamespace(obj) || '-'}
      </TableData>
    )}
  </>
);

export default GeneratedResourceRow;
