import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
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
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { resourcePathFromModel } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';
import { getValidNamespace } from '@utils/utils';
import RouteRow from '@views/routes/list/components/RouteRow';
import useRouteColumns from '@views/routes/list/hooks/useRouteColumns';

import useRouteFilters from './hooks/useRouteFilters';

type RoutesListProps = {
  namespace: string;
};

const RoutesList: FC<RoutesListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [activeNamespace] = useActiveNamespace();
  const validNamespace = getValidNamespace(namespace || activeNamespace);

  const [routesFetch, loaded, loadError] = useK8sWatchResource<RouteKind[]>({
    groupVersionKind: modelToGroupVersionKind(RouteModel),
    isList: true,
    namespace,
  });

  const routeFilters = useRouteFilters();
  const [data, filteredData, onFilterChange] = useListPageFilter(routesFetch, routeFilters);
  const columns = useRouteColumns();

  const routeCreateFormLink = `${resourcePathFromModel(
    RouteModel,
    null,
    validNamespace,
  )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`;

  const title = t('Routes');

  return (
    <ListEmptyState<RouteKind>
      createButtonlink={routeCreateFormLink}
      data={routesFetch}
      error={loadError}
      kind={RouteModel.kind}
      learnMoreLink={getDocumentationURL(documentationURLs.routes)}
      loaded={loaded}
      title={title}
    >
      <ListPageHeader title={title}>
        <ListPageCreateButton
          className="list-page-create-button-margin"
          createAccessReview={{
            groupVersionKind: modelToGroupVersionKind(RouteModel),
            namespace: validNamespace,
          }}
          onClick={() => navigate(routeCreateFormLink)}
        >
          {t('Create Route')}
        </ListPageCreateButton>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          onFilterChange={onFilterChange}
          rowFilters={routeFilters}
        />
        <VirtualizedTable<RouteKind>
          columns={columns}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={RouteRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default RoutesList;
