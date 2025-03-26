import React, { FC } from 'react';
import * as _ from 'lodash';

import { modelToGroupVersionKind, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  ResourceLink,
  Timestamp,
  useAccessReview,
  useAnnotationsModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { Button, ButtonVariant, PageSection, Title } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import Loading from '@utils/components/Loading/Loading';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { Selector } from '@utils/components/Selector/Selector';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import ServiceAddress from './ServiceAddress';
import ServicePortMapping from './ServicePortMapping';

type DetailsProps = {
  obj: IoK8sApiCoreV1Service;
};

const ServiceDetails: FC<DetailsProps> = ({ obj: service }) => {
  const { t } = useNetworkingTranslation();
  const metadata = service?.metadata;
  const annotationsModalLauncher = useAnnotationsModal(service);
  const labelsModalLauncher = useLabelsModal(service);

  const [canUpdate] = useAccessReview({
    group: ServiceModel?.apiGroup,
    name: metadata?.name,
    namespace: metadata?.namespace,
    resource: ServiceModel?.plural,
    verb: 'patch',
  });

  if (!service)
    return (
      <PageSection>
        <Loading />
      </PageSection>
    );

  return (
    <PageSection>
      <div className="row">
        <div className="col-md-6">
          <Title headingLevel="h2">{t('Service details')}</Title>
          <dl className="co-m-pane__details" data-test-id="resource-summary">
            <DetailsItem label={t('Name')} obj={service} path={'metadata.name'} />
            {metadata?.namespace && (
              <DetailsItem label={t('Namespace')} obj={service} path="metadata.namespace">
                <ResourceLink
                  kind="Namespace"
                  name={metadata?.namespace}
                  namespace={null}
                  title={metadata?.uid}
                />
              </DetailsItem>
            )}
            <DetailsItem
              canEdit={canUpdate}
              editAsGroup
              label={t('Labels')}
              obj={service}
              onEdit={labelsModalLauncher}
              path="metadata.labels"
              valueClassName="details-item__value--labels"
            >
              <LabelList
                groupVersionKind={modelToGroupVersionKind(ServiceModel)}
                labels={metadata?.labels}
              />
            </DetailsItem>

            <DetailsItem label={t('Pod selector')} obj={service} path="spec.selector">
              <Selector
                namespace={_.get(service, 'metadata.namespace')}
                selector={_.get(service, 'spec.selector')}
              />
            </DetailsItem>
            <DetailsItem label={t('Annotations')} obj={service} path="metadata.annotations">
              {canUpdate ? (
                <Button
                  data-test="edit-annotations"
                  icon={<PencilAltIcon className="co-icon-space-l pf-v6-c-button-icon--plain" />}
                  iconPosition="end"
                  isInline
                  onClick={annotationsModalLauncher}
                  variant={ButtonVariant.link}
                >
                  {t('{{count}} annotation', {
                    count: _.size(metadata?.annotations),
                  })}
                </Button>
              ) : (
                t('{{count}} annotation', {
                  count: _.size(metadata?.annotations),
                })
              )}
            </DetailsItem>
            <DetailsItem label={t('Session affinity')} obj={service} path="spec.sessionAffinity" />
            <DetailsItem label={t('Created at')} obj={service} path="metadata.creationTimestamp">
              <Timestamp timestamp={metadata?.creationTimestamp} />
            </DetailsItem>
            <DetailsItem label={t('Owner')} obj={service} path="metadata.ownerReferences">
              <OwnerReferences resource={service} />
            </DetailsItem>
          </dl>
        </div>
        <div className="col-md-6">
          <Title headingLevel="h2">{t('Service routing')}</Title>
          <dl>
            <dt>{t('Hostname')}</dt>
            <dd>
              <div className="co-select-to-copy">
                {metadata?.name}.{metadata?.namespace}.svc.cluster.local
              </div>
              <div>{t('Accessible within the cluster only')}</div>
            </dd>
            <dt>{t('Service address')}</dt>
            <dd className="service-ips">
              <ServiceAddress service={service} />
            </dd>
            <DetailsItem label={t('Service port mapping')} obj={service} path="spec.ports">
              <div className="service-ips">
                {service?.spec?.ports ? <ServicePortMapping ports={service.spec.ports} /> : '-'}
              </div>
            </DetailsItem>
          </dl>
        </div>
      </div>
    </PageSection>
  );
};

export default ServiceDetails;
