import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ListPageBody,
  ListPageFilter,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { Pagination } from '@patternfly/react-core';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import usePagination from '@utils/hooks/usePagination/usePagination';
import { paginationDefaultValues } from '@utils/hooks/usePagination/utils/constants';
import { MultiNetworkPolicyModel } from '@utils/models';
import { getResourceURL } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

import NetworkPolicyEmptyState from './components/NetworkPolicyEmptyState';
import NetworkPolicyRow from './components/NetworkPolicyRow';
import useNetworkPolicyColumn from './hooks/useNetworkPolicyColumn';

import '@styles/list-management-group.scss';

type MultiNetworkPolicyListProps = {
  namespace: string;
};

const MultiNetworkPolicyList: FC<MultiNetworkPolicyListProps> = ({ namespace }) => {
  const [multinetworkPolicies, loaded, loadError] = useK8sWatchResource<
    IoK8sApiNetworkingV1NetworkPolicy[]
  >({
    groupVersionKind: modelToGroupVersionKind(MultiNetworkPolicyModel),
    isList: true,
    namespace,
  });

  const { onPaginationChange, pagination } = usePagination();
  const [data, filteredData, onFilterChange] = useListPageFilter(multinetworkPolicies);
  const [columns, activeColumns] = useNetworkPolicyColumn(pagination, filteredData);

  const paginatedData = filteredData?.slice(pagination.startIndex, pagination.endIndex);
  return (
    <ListEmptyState<IoK8sApiNetworkingV1NetworkPolicy>
      createButtonLink={getResourceURL({
        activeNamespace: namespace,
        model: MultiNetworkPolicyModel,
        path: SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM,
      })}
      data={data}
      error={loadError}
      kind={MultiNetworkPolicyModel.kind}
      learnMoreLink={getDocumentationURL(documentationURLs.multipleNetworks)}
      loaded={loaded}
    >
      <ListPageBody>
        <div className="list-management-group">
          <ListPageFilter
            columnLayout={{
              columns: columns?.map(({ additional, id, title: columnTitle }) => ({
                additional,
                id,
                title: columnTitle,
              })),
              id: MultiNetworkPolicyModel.kind,
              selectedColumns: new Set(activeColumns?.map((col) => col?.id)),
              type: '',
            }}
            data={data}
            hideLabelFilter
            loaded={loaded}
            onFilterChange={(...args) => {
              onFilterChange(...args);
              onPaginationChange({
                endIndex: pagination?.perPage,
                page: 1,
                perPage: pagination?.perPage,
                startIndex: 0,
              });
            }}
          />
          {loaded && !isEmpty(filteredData) && (
            <Pagination
              isLastFullPageShown
              itemCount={filteredData.length}
              onPerPageSelect={(_e, perPage, page, startIndex, endIndex) =>
                onPaginationChange({ endIndex, page, perPage, startIndex })
              }
              onSetPage={(_e, page, perPage, startIndex, endIndex) =>
                onPaginationChange({ endIndex, page, perPage, startIndex })
              }
              page={pagination?.page}
              perPage={pagination?.perPage}
              perPageOptions={paginationDefaultValues}
            />
          )}
        </div>
        <VirtualizedTable<IoK8sApiNetworkingV1NetworkPolicy>
          columns={activeColumns}
          data={paginatedData}
          loaded={loaded}
          loadError={loadError}
          NoDataEmptyMsg={NetworkPolicyEmptyState}
          Row={NetworkPolicyRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default MultiNetworkPolicyList;
