import React, { FC } from 'react';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useActiveNamespace,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { resourcePathFromModel } from '@utils/resources/shared';
import { getValidNamespace } from '@utils/utils';
import RouteRow from '@views/routes/list/components/RouteRow';
import useRouteColumns from '@views/routes/list/hooks/useRouteColumns';
import {
  RouteWithHealth,
  useRouteListViewData,
} from '@views/routes/list/hooks/useRouteListViewData';

import useRouteFilters from './hooks/useRouteFilters';

type RoutesListProps = {
  namespace: string;
};

const RoutesList: FC<RoutesListProps> = ({ namespace }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [activeNamespace] = useActiveNamespace();
  const validNamespace = getValidNamespace(namespace || activeNamespace);

  const { data: routes, error: loadError, loaded } = useRouteListViewData(namespace);

  const routeFilters = useRouteFilters();
  const [data, filteredData, onFilterChange] = useListPageFilter(routes, routeFilters);
  const columns = useRouteColumns();

  const routeCreateFormLink = `${resourcePathFromModel(
    RouteModel,
    undefined,
    validNamespace,
  )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`;

  const title = t('Routes');

  return (
    <ListEmptyState<RouteWithHealth>
      createButtonLink={routeCreateFormLink}
      data={data}
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
        <VirtualizedTable<RouteWithHealth>
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
