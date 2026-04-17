import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { IngressModel, modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useActiveNamespace,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { DOC_URL_NETWORK_INGRESS } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_YAML } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getResourceURL } from '@utils/resources/shared';
import { getValidNamespace } from '@utils/utils';
import useIngressColumns from '@views/ingresses/list/hooks/useIngressColumns';

import IngressTableRow from './components/IngressTableRow';

type IngressesListProps = {
  namespace: string;
};

const IngressesList: FC<IngressesListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const [activeNamespace] = useActiveNamespace();
  const navigate = useNavigate();
  const validNamespace = getValidNamespace(namespace || activeNamespace);

  const [ingress, loaded, loadError] = useK8sWatchResource<IoK8sApiNetworkingV1Ingress[]>({
    groupVersionKind: modelToGroupVersionKind(IngressModel),
    isList: true,
    namespace,
  });
  const [data, filteredData, onFilterChange] = useListPageFilter(ingress);
  const columns = useIngressColumns();
  const title = t('Ingresses');

  return (
    <ListEmptyState<IoK8sApiNetworkingV1Ingress>
      createButtonlink={SHARED_DEFAULT_PATH_NEW_RESOURCE_YAML}
      data={data}
      error={loadError}
      kind={IngressModel.kind}
      learnMoreLink={DOC_URL_NETWORK_INGRESS}
      loaded={loaded}
      title={title}
    >
      <ListPageHeader title={title}>
        <ListPageCreateButton
          className="list-page-create-button-margin"
          createAccessReview={{
            groupVersionKind: modelToGroupVersionKind(IngressModel),
            namespace: validNamespace,
          }}
          onClick={() =>
            navigate(
              getResourceURL({
                activeNamespace: validNamespace,
                model: IngressModel,
                path: SHARED_DEFAULT_PATH_NEW_RESOURCE_YAML,
              }),
            )
          }
        >
          {t('Create Ingress')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VirtualizedTable<IoK8sApiNetworkingV1Ingress>
          columns={columns}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={IngressTableRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default IngressesList;
