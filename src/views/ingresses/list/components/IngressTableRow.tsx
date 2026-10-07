import React, { FC } from 'react';
import classNames from 'classnames';

import { NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { IngressModel } from '@utils/models';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import HostDetails from '@utils/components/HostData/HostDetails';
import MutedText from '@utils/components/MutedText/MutedText';
import { t } from '@utils/hooks/useNetworkingTranslation';
import IngressActions from '@views/ingresses/actions/IngressActions';
import { getHostsStr } from '@views/ingresses/list/utils/utils';
import { tableColumnClasses } from '@views/services/list/hooks/useServiceColumn';

type IngressTableRowProps = RowProps<IoK8sApiNetworkingV1Ingress>;

const IngressTableRow: FC<IngressTableRowProps> = ({ activeColumnIDs, obj: ingress }) => {
  const hostsStr = getHostsStr(ingress);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[0]} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(IngressModel)}
          name={ingress.metadata.name}
          namespace={ingress.metadata.namespace}
        />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        id="namespace"
      >
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
          name={ingress.metadata.namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[2]} id="labels">
        <LabelList
          groupVersionKind={getGroupVersionKindForModel(IngressModel)}
          labels={ingress.metadata.labels}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[3]} id="hosts">
        {hostsStr ? (
          <HostDetails title={hostsStr}>{hostsStr}</HostDetails>
        ) : (
          <MutedText content={t('No hosts')} />
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="">
        <IngressActions ingress={ingress} isKebabToggle />
      </TableData>
    </>
  );
};

export default IngressTableRow;
