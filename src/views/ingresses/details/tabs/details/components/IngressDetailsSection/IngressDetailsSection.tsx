import React, { FC } from 'react';

import { IngressModel, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  getGroupVersionKindForModel,
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
import {
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getUID,
} from '@utils/resources/shared';

import TLSCert from './TLSCert';

type IngressDetailsSectionProps = {
  ingress: IoK8sApiNetworkingV1Ingress;
};

const IngressDetailsSection: FC<IngressDetailsSectionProps> = ({ ingress }) => {
  const { t } = useNetworkingTranslation();
  const annotationsModalLauncher = useAnnotationsModal(ingress);
  const labelsModalLauncher = useLabelsModal(ingress);
  const ingressNamespace = getNamespace(ingress);

  const [canUpdate] = useAccessReview({
    group: IngressModel?.apiGroup,
    name: getName(ingress),
    namespace: ingressNamespace,
    resource: IngressModel?.plural,
    verb: 'patch',
  });

  return (
    <DL>
      <DetailsItem label={t('Name')} obj={ingress} path="metadata.name" />
      {ingressNamespace && (
        <DetailsItem label={t('Namespace')} obj={ingress} path="metadata.namespace">
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={ingressNamespace}
            title={getUID(ingress)}
          />
        </DetailsItem>
      )}
      <DetailsItem
        canEdit={canUpdate}
        editAsGroup
        label={t('Labels')}
        obj={ingress}
        onEdit={labelsModalLauncher}
        path="metadata.labels"
        valueClassName="co-editable-label-group"
      >
        <LabelList
          groupVersionKind={getGroupVersionKindForModel(IngressModel)}
          labels={getLabels(ingress)}
        />
      </DetailsItem>
      <DetailsItem
        canEdit={canUpdate}
        label={t('Annotations')}
        obj={ingress}
        onEdit={annotationsModalLauncher}
        path="metadata.annotations"
      >
        {t('{{count}} annotation', {
          count: Object.keys(ingress?.metadata?.annotations || {}).length,
        })}
      </DetailsItem>
      <DetailsItem label={t('TLS certificate')}>
        <TLSCert ingress={ingress} />
      </DetailsItem>
      <DetailsItem label={t('Created at')} obj={ingress} path="metadata.creationTimestamp">
        <Timestamp timestamp={getCreationTimestamp(ingress)} />
      </DetailsItem>
      <DetailsItem label={t('Owner')} obj={ingress} path="metadata.ownerReferences">
        <OwnerReferences resource={ingress} />
      </DetailsItem>
    </DL>
  );
};

export default IngressDetailsSection;
