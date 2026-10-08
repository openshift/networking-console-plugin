import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { isEmpty } from 'lodash';

import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { Selector } from '@utils/components/Selector/Selector';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NamespaceModel } from '@utils/models';
import { getGroupVersionKindForModel } from '@utils/models';
import { getPolicyModel } from '@utils/resources/networkpolicies/utils';
import { getName, getNamespace } from '@utils/resources/shared';
import { NetworkPolicy } from '@utils/types/k8sTypes';
import NetworkPolicyActions from '@views/networkpolicies/actions/NetworkPolicyActions';

type NetworkPolicyRowType = RowProps<NetworkPolicy>;

const NetworkPolicyRow: FC<NetworkPolicyRowType> = ({ activeColumnIDs, obj }) => {
  const { t } = useNetworkingTranslation();

  const namespace = getNamespace(obj);
  const name = getName(obj);

  const policyModel = getPolicyModel(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(policyModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
          name={namespace}
        />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-m-hidden pf-m-visible-on-md"
        id="pod-selector"
      >
        {isEmpty(obj.spec.podSelector) ? (
          <Link to={`/search/ns/${obj.metadata.namespace}?kind=Pod`}>
            {t('All pods within {{namespace}}', { namespace: obj.metadata.namespace })}
          </Link>
        ) : (
          <Selector namespace={obj.metadata.namespace} selector={obj.spec.podSelector} />
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className="pf-v6-c-table__action" id="">
        <NetworkPolicyActions isKebabToggle obj={obj} />
      </TableData>
    </>
  );
};
export default NetworkPolicyRow;
