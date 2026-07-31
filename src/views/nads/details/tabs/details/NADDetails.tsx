import React, { FC } from 'react';
import { size } from 'lodash';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
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
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getAnnotations, getLabels, getName, getNamespace, getUID } from '@utils/resources/shared';

import NADDescriptionDetails from './NADDescriptionDetails';
import NADTypeDetails from './NADTypeDetails';

type NADDetailsProps = {
  obj?: NetworkAttachmentDefinitionKind;
};

const NADDetails: FC<NADDetailsProps> = ({ obj: nad }) => {
  const { t } = useNetworkingTranslation();
  const name = getName(nad);
  const namespace = getNamespace(nad);
  const annotationsModalLauncher = useAnnotationsModal(nad);
  const labelsModalLauncher = useLabelsModal(nad);

  const [canUpdate] = useAccessReview({
    group: NetworkAttachmentDefinitionModel.apiGroup,
    name,
    namespace,
    resource: NetworkAttachmentDefinitionModel.plural,
    verb: 'patch',
  });

  if (!nad) {
    return (
      <PageSection>
        <Loading />
      </PageSection>
    );
  }

  const annotationCount = size(getAnnotations(nad, {}));

  return (
    <PageSection>
      <DetailsSectionTitle
        titleText={t('{{kind}} details', { kind: NetworkAttachmentDefinitionModel.kind })}
      />
      <Grid hasGutter>
        <GridItem md={6}>
          <DL className="co-m-pane__details" data-test-id="resource-summary">
            <DetailsItem label={t('Name')} obj={nad} path="metadata.name" />
            {namespace && (
              <DetailsItem label={t('Namespace')} obj={nad} path="metadata.namespace">
                <ResourceLink
                  kind="Namespace"
                  name={namespace}
                  namespace={null}
                  title={getUID(nad)}
                />
              </DetailsItem>
            )}
            <DetailsItem
              canEdit={canUpdate}
              editAsGroup
              label={t('Labels')}
              obj={nad}
              onEdit={labelsModalLauncher}
              path="metadata.labels"
              valueClassName="co-editable-label-group"
            >
              <LabelList
                groupVersionKind={modelToGroupVersionKind(NetworkAttachmentDefinitionModel)}
                labels={getLabels(nad)}
              />
            </DetailsItem>
            <DetailsItem label={t('Annotations')} obj={nad} path="metadata.annotations">
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
                    count: annotationCount,
                  })}
                </Button>
              ) : (
                t('{{count}} annotation', {
                  count: annotationCount,
                })
              )}
            </DetailsItem>
            <DetailsItem label={t('Description')} obj={nad} path="metadata.annotations.description">
              <NADDescriptionDetails nad={nad} />
            </DetailsItem>
            <DetailsItem label={t('Created at')} obj={nad} path="metadata.creationTimestamp">
              <Timestamp timestamp={nad.metadata?.creationTimestamp} />
            </DetailsItem>
            <DetailsItem label={t('Owner')} obj={nad} path="metadata.ownerReferences">
              <OwnerReferences resource={nad} />
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={6}>
          <DL>
            <DetailsItem label={t('Type')} obj={nad} path="spec.config.type">
              <NADTypeDetails nad={nad} />
            </DetailsItem>
          </DL>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default NADDetails;
