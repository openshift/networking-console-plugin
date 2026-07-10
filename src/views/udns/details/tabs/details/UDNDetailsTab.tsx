import React, { FC } from 'react';
import * as _ from 'lodash';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import {
  ResourceLink,
  Timestamp,
  useAccessReview,
  useAnnotationsModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  DescriptionList as DL,
  Grid,
  GridItem,
  PageSection,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import Loading from '@utils/components/Loading/Loading';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getModel, getUDNConditions } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import UDNConditions from '@views/udns/list/components/UDNConditions';

import UDNLayerDetails from './UDNLayerDetails';
import UDNTopologyDetails from './UDNTopologyDetails';

type UDNDetailsTabProps = {
  obj?: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
};

const UDNDetailsTab: FC<UDNDetailsTabProps> = ({ obj: udn }) => {
  const { t } = useNetworkingTranslation();
  const metadata = udn?.metadata;
  const model = udn ? getModel(udn) : undefined;
  const annotationsModalLauncher = useAnnotationsModal(udn);
  const labelsModalLauncher = useLabelsModal(udn);

  const [canUpdate] = useAccessReview({
    group: model?.apiGroup,
    name: metadata?.name,
    namespace: metadata?.namespace,
    resource: model?.plural,
    verb: 'patch',
  });

  if (!udn || !model) {
    return (
      <PageSection>
        <Loading />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <DetailsSectionTitle titleText={t('{{kind}} details', { kind: model.kind })} />
      <Grid hasGutter>
        <GridItem md={6}>
          <DL className="co-m-pane__details" data-test-id="resource-summary">
            <DetailsItem label={t('Name')} obj={udn} path="metadata.name" />
            {metadata?.namespace && (
              <DetailsItem label={t('Namespace')} obj={udn} path="metadata.namespace">
                <ResourceLink
                  kind="Namespace"
                  name={metadata.namespace}
                  namespace={null}
                  title={metadata.uid}
                />
              </DetailsItem>
            )}
            <DetailsItem
              canEdit={canUpdate}
              editAsGroup
              label={t('Labels')}
              obj={udn}
              onEdit={labelsModalLauncher}
              path="metadata.labels"
              valueClassName="co-editable-label-group"
            >
              <LabelList
                groupVersionKind={modelToGroupVersionKind(model)}
                labels={metadata?.labels}
              />
            </DetailsItem>
            <DetailsItem label={t('Annotations')} obj={udn} path="metadata.annotations">
              {canUpdate ? (
                <Button
                  data-test="edit-annotations"
                  icon={<PencilAltIcon />}
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
            <DetailsItem label={t('Created at')} obj={udn} path="metadata.creationTimestamp">
              <Timestamp timestamp={metadata?.creationTimestamp} />
            </DetailsItem>
            <DetailsItem label={t('Owner')} obj={udn} path="metadata.ownerReferences">
              <OwnerReferences resource={udn} />
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={6}>
          <DL>
            <DetailsItem label={t('Topology')} obj={udn}>
              <UDNTopologyDetails obj={udn} />
            </DetailsItem>
            <DetailsItem label={t('Conditions')} obj={udn}>
              <UDNConditions conditions={getUDNConditions(udn)} />
            </DetailsItem>
            <UDNLayerDetails obj={udn} />
          </DL>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default UDNDetailsTab;
