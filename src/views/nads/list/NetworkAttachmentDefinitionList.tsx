import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import NetworkAttachmentDefinitionModel, {
  NetworkAttachmentDefinitionModelGroupVersionKind,
} from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import {
  K8sVerb,
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  ListPageHeader,
  useAccessReview,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import ListEmptyState from '@utils/components/ListEmptyState/ListEmptyState';
import { DEFAULT_NAMESPACE } from '@utils/constants';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM } from '@utils/constants/ui';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { resourcePathFromModel } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

import NADListEmpty from './components/NADListEmpty/NADListEmpty';
import NADsRow from './components/NADsRow/NADsRow';
import useNADsColumns from './hooks/useNADsColumns';

type NetworkAttachmentDefinitionListProps = {
  namespace: string;
};

const NetworkAttachmentDefinitionList: FC<NetworkAttachmentDefinitionListProps> = ({
  namespace,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  const [nads, loaded, loadError] = useK8sWatchResource<NetworkAttachmentDefinitionKind[]>({
    groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
    isList: true,
    namespace,
  });
  const [data, filteredData, onFilterChange] = useListPageFilter(nads);
  const columns = useNADsColumns();
  const title = t('NetworkAttachmentDefinitions');

  const [canCreateNAD] = useAccessReview({
    group: NetworkAttachmentDefinitionModel.apiGroup,
    resource: NetworkAttachmentDefinitionModel.plural,
    verb: 'create' as K8sVerb,
  });

  return (
    <ListEmptyState<NetworkAttachmentDefinitionKind>
      canCreate={canCreateNAD}
      createButtonlink={SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}
      data={data}
      error={loadError}
      kind={NetworkAttachmentDefinitionModel.kind}
      learnMoreLink={getDocumentationURL(documentationURLs.multipleNetworks)}
      loaded={loaded}
      title={title}
    >
      <ListPageHeader title={title}>
        {!isEmpty(nads) && (
          <ListPageCreateButton
            className="list-page-create-button-margin"
            createAccessReview={{
              groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
              namespace,
            }}
            onClick={() =>
              navigate(
                `${resourcePathFromModel(
                  NetworkAttachmentDefinitionModel,
                  null,
                  namespace || DEFAULT_NAMESPACE,
                )}/${SHARED_DEFAULT_PATH_NEW_RESOURCE_FORM}`,
              )
            }
          >
            {t('Create NetworkAttachmentDefinition')}
          </ListPageCreateButton>
        )}
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VirtualizedTable<NetworkAttachmentDefinitionKind>
          columns={columns}
          data={filteredData}
          EmptyMsg={() => <NADListEmpty namespace={namespace} />}
          loaded={loaded}
          loadError={loadError}
          Row={NADsRow}
          unfilteredData={data}
        />
      </ListPageBody>
    </ListEmptyState>
  );
};

export default NetworkAttachmentDefinitionList;
