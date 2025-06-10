import React, { FC } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ResourceLink,
  Timestamp,
  useAccessReview,
  useAnnotationsModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { DescriptionList as DL } from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getPolicyModel } from '@utils/resources/networkpolicies/utils';

type NetworkPolicyDetailsMetadataProps = {
  networkPolicy: IoK8sApiNetworkingV1NetworkPolicy;
};

const NetworkPolicyDetailsMetadata: FC<NetworkPolicyDetailsMetadataProps> = ({ networkPolicy }) => {
  const { t } = useNetworkingTranslation();

  const policyModel = getPolicyModel(networkPolicy);

  const metadata = networkPolicy?.metadata;
  const annotationsModalLauncher = useAnnotationsModal(networkPolicy);
  const labelsModalLauncher = useLabelsModal(networkPolicy);

  const [canUpdate] = useAccessReview({
    group: policyModel?.apiGroup,
    name: metadata?.name,
    namespace: metadata?.namespace,
    resource: policyModel?.plural,
    verb: 'patch',
  });

  return (
    <DL>
      <DetailsItem label={t('Name')} obj={networkPolicy} path={'metadata.name'} />
      <DetailsItem label={t('Namespace')} obj={networkPolicy} path="metadata.namespace">
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
          name={metadata.namespace}
        />
      </DetailsItem>
      <DetailsItem
        canEdit={canUpdate}
        editAsGroup
        label={t('Labels')}
        obj={networkPolicy}
        onEdit={labelsModalLauncher}
        path="metadata.labels"
        valueClassName="co-editable-label-group"
      >
        <LabelList
          groupVersionKind={modelToGroupVersionKind(policyModel)}
          labels={metadata?.labels}
        />
      </DetailsItem>
      <DetailsItem
        canEdit={canUpdate}
        label={t('Annotations')}
        obj={networkPolicy}
        onEdit={annotationsModalLauncher}
        path="metadata.annotations"
      >
        {t('{{count}} annotation', {
          count: Object.keys(metadata?.annotations || {}).length,
        })}
      </DetailsItem>
      <DetailsItem label={t('Created at')} obj={networkPolicy} path="metadata.creationTimestamp">
        <Timestamp timestamp={metadata?.creationTimestamp} />
      </DetailsItem>
      <DetailsItem label={t('Owner')} obj={networkPolicy} path="metadata.ownerReferences">
        <OwnerReferences resource={networkPolicy} />
      </DetailsItem>
    </DL>
  );
};

export default NetworkPolicyDetailsMetadata;
