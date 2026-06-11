import React, { FC } from 'react';

import { modelToGroupVersionKind, NetworkPolicyModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ListPageBody,
  ListPageFilter,
  useFlag,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import { Pagination } from '@patternfly/react-core';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { FLAGS } from '@utils/constants';
import { getNetworkPolicyDocURL } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import usePagination from '@utils/hooks/usePagination/usePagination';
import { paginationDefaultValues } from '@utils/hooks/usePagination/utils/constants';
import { getResourceURL } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

import NetworkPolicyEmptyState from './components/NetworkPolicyEmptyState';
import NetworkPolicyRow from './components/NetworkPolicyRow';
import useNetworkPolicyColumn from './hooks/useNetworkPolicyColumn';

import '@styles/list-management-group.scss';

type NetworkPolicyListProps = {
  namespace: string;
};

const NetworkPolicyList: FC<NetworkPolicyListProps> = ({ namespace }) => {
  const [networkPolicies, loaded, loadError] = useK8sWatchResource<
    IoK8sApiNetworkingV1NetworkPolicy[]
  >({
    groupVersionKind: modelToGroupVersionKind(NetworkPolicyModel),
    isList: true,
    namespace,
  });

  const { onPaginationChange, pagination } = usePagination();
  const [data, filteredData, onFilterChange] = useListPageFilter(networkPolicies);
  const [columns, activeColumns] = useNetworkPolicyColumn(pagination, filteredData);
  const hasOpenshiftFlag = useFlag(FLAGS.OPENSHIFT);

  return (
    <ListEmptyState<IoK8sApiNetworkingV1NetworkPolicy>
      createButtonLink={getResourceURL({
        activeNamespace: namespace,
        model: { ...NetworkPolicyModel, crd: true },
        path: SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM,
      })}
      data={data}
      error={loadError}
      kind={NetworkPolicyModel.kind}
      learnMoreLink={getNetworkPolicyDocURL(hasOpenshiftFlag)}
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
              id: NetworkPolicyModel.kind,
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
          data={filteredData}
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

export default NetworkPolicyList;
