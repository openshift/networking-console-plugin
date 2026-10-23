import React, { FC } from 'react';

import { NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  getGroupVersionKindForModel,
  getGroupVersionKindForResource,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { DescriptionList } from '@patternfly/react-core';
import DescriptionDetails from '@utils/components/DescriptionDetails/DescriptionDetails';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getUID,
} from '@utils/resources/shared';
import { useTopologyContext } from '@views/topology/context/TopologyContext';

import './TopologyDrawerContent.scss';

const TopologyDrawerContentBody: FC = () => {
  const { t } = useNetworkingTranslation();
  const { selectedNode } = useTopologyContext();

  if (!selectedNode) return null;

  const { resource } = selectedNode;
  const resourceNamespace = getNamespace(resource);
  const resourceGroupVersionKind = getGroupVersionKindForResource(resource);

  return (
    <>
      <div className="topology-drawer__content">
        <DescriptionList>
          <DetailsItem label={t('Name')} obj={resource} path="metadata.name">
            <ResourceLink
              groupVersionKind={resourceGroupVersionKind}
              name={getName(resource)}
              namespace={resourceNamespace}
            />
          </DetailsItem>
          {resourceNamespace && (
            <DetailsItem label={t('Namespace')} obj={resource} path="metadata.namespace">
              <ResourceLink
                groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
                name={resourceNamespace}
                namespace={null}
                title={getUID(resource)}
              />
            </DetailsItem>
          )}
          <DetailsItem
            canEdit={false}
            label={t('Labels')}
            obj={resource}
            path="metadata.labels"
            valueClassName="co-editable-label-group"
          >
            <LabelList groupVersionKind={resourceGroupVersionKind} labels={getLabels(resource)} />
          </DetailsItem>
          <DetailsItem
            label={t('Description')}
            obj={resource}
            path="metadata.annotations.description"
          >
            <DescriptionDetails obj={resource} />
          </DetailsItem>
          <DetailsItem label={t('Created at')} obj={resource} path="metadata.creationTimestamp">
            <Timestamp timestamp={getCreationTimestamp(resource)} />
          </DetailsItem>
          <DetailsItem label={t('Owner')} obj={resource} path="metadata.ownerReferences">
            <OwnerReferences resource={resource} />
          </DetailsItem>
        </DescriptionList>
      </div>
    </>
  );
};

export default TopologyDrawerContentBody;
