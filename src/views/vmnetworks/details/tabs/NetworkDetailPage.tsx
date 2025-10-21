import React, { FC } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import {
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
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { getAnnotations, getLabels, getName, getNamespace } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

type NetworkDetailsPageProps = {
  obj: ClusterUserDefinedNetworkKind;
};

const NetworkDetailsPage: FC<NetworkDetailsPageProps> = ({ obj: network }) => {
  const { t } = useNetworkingTranslation();
  const name = getName(network);
  const namespace = getNamespace(network);
  const annotations = getAnnotations(network);
  const labels = getLabels(network);

  const annotationsModalLauncher = useAnnotationsModal(network);
  const labelsModalLauncher = useLabelsModal(network);

  const annotationsText = t('{{count}} annotation', {
    count: Object.keys(annotations || {}).length,
  });

  const [canUpdate] = useAccessReview({
    group: ClusterUserDefinedNetworkModel?.apiGroup,
    name,
    namespace,
    resource: ClusterUserDefinedNetworkModel?.plural,
    verb: 'patch',
  });

  if (!network)
    return (
      <PageSection>
        <Loading />
      </PageSection>
    );

  return (
    <PageSection>
      <Grid hasGutter>
        <GridItem md={6}>
          <DetailsSectionTitle titleText={t('Virtual Machine Network details')} />
          <DL className="co-m-pane__details" data-test-id="resource-summary">
            <DetailsItem label={t('Name')} obj={network} path={'metadata.name'} />
            <DetailsItem
              canEdit={canUpdate}
              editAsGroup
              label={t('Labels')}
              obj={network}
              onEdit={labelsModalLauncher}
              path="metadata.labels"
              valueClassName="co-editable-label-group"
            >
              <LabelList
                groupVersionKind={modelToGroupVersionKind(ClusterUserDefinedNetworkModel)}
                labels={labels}
              />
            </DetailsItem>
            <DetailsItem label={t('Annotations')} obj={network} path="metadata.annotations">
              {canUpdate ? (
                <Button
                  data-test="edit-annotations"
                  icon={<PencilAltIcon />}
                  iconPosition="end"
                  isInline
                  onClick={annotationsModalLauncher}
                  variant={ButtonVariant.link}
                >
                  {annotationsText}
                </Button>
              ) : (
                annotationsText
              )}
            </DetailsItem>
            <DetailsItem label={t('Created at')} obj={network} path="metadata.creationTimestamp">
              <Timestamp timestamp={network?.metadata?.creationTimestamp} />
            </DetailsItem>
            <DetailsItem label={t('Owner')} obj={network} path="metadata.ownerReferences">
              <OwnerReferences resource={network} />
            </DetailsItem>
          </DL>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default NetworkDetailsPage;
