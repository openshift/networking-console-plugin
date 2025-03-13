import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { isEmpty } from 'lodash';

import { NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console/modelUtils';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { Selector } from '@utils/components/Selector/Selector';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getPolicyModel } from '@utils/resources/networkpolicies/utils';
import { getName, getNamespace } from '@utils/resources/shared';
import NetworkPolicyActions from '@views/networkpolicies/actions/NetworkPolicyActions';

type NetworkPolicyRowType = RowProps<IoK8sApiNetworkingV1NetworkPolicy>;

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
        <ResourceLink groupVersionKind={modelToGroupVersionKind(NamespaceModel)} name={namespace} />
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
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="dropdown-kebab-pf pf-v6-c-table__action"
        id=""
      >
        <NetworkPolicyActions isKebabToggle obj={obj} />
      </TableData>
    </>
  );
};
export default NetworkPolicyRow;
