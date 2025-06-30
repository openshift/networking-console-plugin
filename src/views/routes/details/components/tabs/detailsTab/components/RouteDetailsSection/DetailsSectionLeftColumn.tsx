import React, { FC } from 'react';
import * as _ from 'lodash';

import { NamespaceModel, RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  Timestamp,
  useAccessReview,
  useAnnotationsModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { Button, ButtonVariant, DescriptionList as DL, GridItem } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { OwnerReferences } from '@utils/components/OwnerReference/owner-references';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  getAnnotations,
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getUID,
} from '@utils/resources/shared';
import { RouteKind } from '@utils/types';

type DetailsSectionLeftColumnProps = { route: RouteKind };

const DetailsSectionLeftColumn: FC<DetailsSectionLeftColumnProps> = ({ route }) => {
  const { t } = useNetworkingTranslation();

  const name = getName(route);
  const namespace = getNamespace(route);

  const annotationsModalLauncher = useAnnotationsModal(route);
  const labelsModalLauncher = useLabelsModal(route);
  const [canUpdate] = useAccessReview({
    group: RouteModel.apiGroup,
    name,
    namespace,
    resource: RouteModel.plural,
    verb: 'patch',
  });

  return (
    <GridItem sm={6}>
      <DL className="co-m-pane__details" data-test-id="resource-summary">
        <DetailsItem label={t('Name')} obj={route} path={'metadata.name'} />
        {namespace && (
          <DetailsItem label={t('Namespace')} obj={route} path="metadata.namespace">
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
              name={namespace}
              namespace={null}
              title={getUID(route)}
            />
          </DetailsItem>
        )}
        <DetailsItem
          canEdit={canUpdate}
          editAsGroup
          label={t('Labels')}
          obj={route}
          onEdit={labelsModalLauncher}
          path="metadata.labels"
          valueClassName="co-editable-label-group"
        >
          <LabelList
            groupVersionKind={getGroupVersionKindForModel(RouteModel)}
            labels={getLabels(route)}
          />
        </DetailsItem>
        <DetailsItem label={t('Annotations')} obj={route} path="metadata.annotations">
          {canUpdate ? (
            <Button
              data-test="edit-annotations"
              icon={<PencilAltIcon />}
              iconPosition="end"
              isInline
              onClick={annotationsModalLauncher}
              variant={ButtonVariant.link}
            >
              {t('{{count}} annotation', { count: _.size(getAnnotations(route, {})) })}
            </Button>
          ) : (
            t('{{count}} annotation', { count: _.size(getAnnotations(route, {})) })
          )}
        </DetailsItem>
        <DetailsItem label={t('Service')} obj={route} path="spec.to.name">
          <ResourceLink
            kind={route.spec.to.kind}
            name={route.spec.to.name}
            namespace={namespace}
            title={route.spec.to.name}
          />
        </DetailsItem>
        <DetailsItem label={t('Target port')} obj={route} path="spec.port.targetPort" />
        <DetailsItem label={t('Created at')} obj={route} path="metadata.creationTimestamp">
          <Timestamp timestamp={getCreationTimestamp(route)} />
        </DetailsItem>
        <DetailsItem label={t('Owner')} obj={route} path="metadata.ownerReferences">
          <OwnerReferences resource={route} />
        </DetailsItem>
      </DL>
    </GridItem>
  );
};

export default DetailsSectionLeftColumn;
