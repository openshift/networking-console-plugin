import React, { FC, ReactNode } from 'react';
import { Link } from 'react-router';

import {
  modelToGroupVersionKind,
  NamespaceModel,
  PodModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  K8sResourceCommon,
  K8sResourceKind,
  ResourceLink,
  useK8sModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  DescriptionList as DL,
  Grid,
  GridItem,
  Label,
  LabelGroup,
} from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel, BGPRoutingModelGroupVersionKind } from '@utils/models';
import { BGPRouting, condition } from '@utils/resources/bgp';
import { getName, resourceListPathFromModel } from '@utils/resources/shared';
import { getCUDNProjects, udnIsReady } from '@utils/resources/udns/helper';
import { getUDNConditions } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';
import { BGPStatus } from '@views/bgp/components/BGPStatus';

type CUDNNamespaceMembershipProps = {
  cudn: ClusterUserDefinedNetworkKind;
};

const selectorEntry = (key: string, value?: string) => (value ? `${key}=${value}` : key);

const selectorOperator = (operator: string) => {
  switch (operator) {
    case 'In':
      return 'in';
    case 'NotIn':
      return 'notin';
    case 'Exists':
      return 'exists';
    case 'DoesNotExist':
      return 'does not exist';
    default:
      return operator;
  }
};

const CUDNNamespaceMembership: FC<CUDNNamespaceMembershipProps> = ({ cudn }) => {
  const { t } = useNetworkingTranslation();
  const [bgpRoutingModel] = useK8sModel(BGPRoutingModelGroupVersionKind);
  const bgpEnabled = !isEmpty(bgpRoutingModel);
  const [namespaces, namespacesLoaded, namespacesError] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: modelToGroupVersionKind(NamespaceModel),
    isList: true,
  });
  const [pods, podsLoaded, podsError] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: modelToGroupVersionKind(PodModel),
    isList: true,
  });
  const [routings, routingsLoaded] = useK8sWatchResource<BGPRouting[]>(
    bgpEnabled
      ? {
          groupVersionKind: modelToGroupVersionKind(BGPRoutingModel),
          isList: true,
        }
      : null,
  );

  const selector = cudn.spec?.namespaceSelector || {};
  const matchLabels = Object.entries(selector.matchLabels || {});
  const canFilterNamespaceList = matchLabels.length > 0 && !selector.matchExpressions?.length;
  const namespaceListLink = canFilterNamespaceList
    ? `${resourceListPathFromModel(NamespaceModel)}?labels=${encodeURIComponent(
        matchLabels.map(([key, value]) => `${key}=${value}`).join(','),
      )}`
    : undefined;
  const matchingNamespaces = getCUDNProjects(cudn, (namespaces || []) as K8sResourceCommon[]);
  const matchingNamespaceNames = matchingNamespaces.map(getName).filter(Boolean);
  const matchingNamespaceSet = new Set(matchingNamespaceNames);
  const matchingPodCount = podsLoaded
    ? (pods || []).filter((pod) => matchingNamespaceSet.has(pod.metadata?.namespace)).length
    : undefined;
  const relatedRoutings = (routings || []).filter(
    (routing) =>
      routing.spec?.network?.name === cudn.metadata?.name ||
      `cluster-udn-${routing.spec?.network?.name}` === cudn.metadata?.name,
  );
  const conditions = getUDNConditions(cudn);
  const noMatchingNamespaces =
    namespacesLoaded && !namespacesError && matchingNamespaces.length === 0;
  const readinessCondition = conditions.find(
    (udnCondition) =>
      udnCondition.type === 'NetworkCreated' || udnCondition.type === 'NetworkAllocationSucceeded',
  );
  let podCount: ReactNode = t('Loading');
  if (podsError) {
    podCount = t('Unavailable');
  } else if (podsLoaded) {
    podCount = matchingPodCount;
  }

  const selectorEntries: ReactNode[] = [
    ...Object.entries(selector.matchLabels || {}).map(([key, value]) => (
      <Label color="blue" key={`label-${key}`} variant="outline">
        {selectorEntry(key, value)}
      </Label>
    )),
    ...(selector.matchExpressions || []).map((expression, index) => (
      <Label color="blue" key={`expression-${expression.key}-${index}`} variant="outline">
        {expression.key} {selectorOperator(expression.operator)} {expression.values?.join(', ')}
      </Label>
    )),
  ];
  let selectorContent: ReactNode;
  if (!selectorEntries.length) {
    selectorContent = t('All namespaces');
  } else if (namespaceListLink) {
    selectorContent = (
      <Link to={namespaceListLink}>
        <LabelGroup>{selectorEntries}</LabelGroup>
      </Link>
    );
  } else {
    selectorContent = <LabelGroup>{selectorEntries}</LabelGroup>;
  }

  let membershipContent: ReactNode;
  if (namespacesError) {
    membershipContent = (
      <Alert
        isInline
        title={t('Unable to load matching namespaces')}
        variant={AlertVariant.warning}
      >
        {namespacesError.message || t('The namespace membership query could not be completed.')}
      </Alert>
    );
  } else if (!namespacesLoaded) {
    membershipContent = <Loading />;
  } else if (matchingNamespaces.length) {
    membershipContent = (
      <DL className="co-m-pane__details pf-v6-u-mt-md">
        <DetailsItem label={t('Namespaces')} obj={cudn}>
          <LabelGroup>
            {matchingNamespaces.map((namespace) => (
              <Label color="blue" key={namespace.metadata?.name} variant="outline">
                <ResourceLink
                  groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
                  name={namespace.metadata?.name}
                />
              </Label>
            ))}
          </LabelGroup>
        </DetailsItem>
      </DL>
    );
  } else {
    membershipContent = (
      <Alert
        className="pf-v6-u-mt-md"
        isInline
        title={t('No namespaces match this selector')}
        variant={AlertVariant.warning}
      >
        {t(
          'Namespaces can be created before or after this network. Add the selector labels above to include them.',
        )}
        <p className="pf-v6-u-mb-0 pf-v6-u-mt-sm">
          {selectorEntries.length
            ? t(
                'Namespaces must satisfy all selector requirements, including labels that must be absent and alternative values.',
              )
            : t('This network has no namespace selector and can include all namespaces.')}
        </p>
      </Alert>
    );
  }

  return (
    <>
      <Alert
        className="pf-v6-u-mt-md"
        isInline
        title={udnIsReady(cudn) ? t('Network is ready') : t('Network is not ready')}
        variant={udnIsReady(cudn) ? AlertVariant.success : AlertVariant.warning}
      >
        {readinessCondition?.message ||
          (udnIsReady(cudn)
            ? t('The network is ready for selected namespaces.')
            : t('Check the network conditions below for reconciliation details.'))}
      </Alert>
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Namespace membership')} />
      <Grid hasGutter>
        <GridItem md={6}>
          <DL className="co-m-pane__details">
            <DetailsItem label={t('Selector')} obj={cudn}>
              {selectorContent}
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={3}>
          <DL className="co-m-pane__details">
            <DetailsItem label={t('Matching')} obj={cudn}>
              <span>{namespacesLoaded ? matchingNamespaces.length : t('Loading')}</span>
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={3}>
          <DL className="co-m-pane__details">
            <DetailsItem label={t('Pods')} obj={cudn}>
              <span>{podCount}</span>
            </DetailsItem>
          </DL>
        </GridItem>
      </Grid>
      {membershipContent}
      {!noMatchingNamespaces && (
        <Alert
          className="pf-v6-u-mt-md"
          isInline
          title={t('Label guidance')}
          variant={AlertVariant.info}
        >
          {selectorEntries.length
            ? t(
                'Namespaces must satisfy all selector requirements, including labels that must be absent and alternative values.',
              )
            : t('This network has no namespace selector and can include all namespaces.')}
        </Alert>
      )}
      {bgpEnabled && routingsLoaded && relatedRoutings.length > 0 && (
        <>
          <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('BGP routings')} />
          <Grid hasGutter>
            {relatedRoutings.map((routing) => {
              const available = condition(routing.status?.conditions);
              return (
                <GridItem key={routing.metadata?.name} span={12}>
                  <Grid hasGutter>
                    <GridItem md={6}>
                      <Grid hasGutter>
                        <GridItem md={6}>
                          <DL className="co-m-pane__details">
                            <DetailsItem label={t('Name')} obj={routing}>
                              <ResourceLink
                                groupVersionKind={modelToGroupVersionKind(BGPRoutingModel)}
                                name={routing.metadata?.name}
                              />
                            </DetailsItem>
                          </DL>
                        </GridItem>
                        <GridItem md={6}>
                          <DL className="co-m-pane__details">
                            <DetailsItem label={t('Network')} obj={routing}>
                              {routing.spec?.network?.name || t('Unknown')}
                            </DetailsItem>
                          </DL>
                        </GridItem>
                      </Grid>
                    </GridItem>
                    <GridItem md={6}>
                      <Grid hasGutter>
                        <GridItem md={6}>
                          <DL className="co-m-pane__details">
                            <DetailsItem label={t('Phase')} obj={routing}>
                              <BGPStatus condition={available} phase={routing.status?.phase} />
                            </DetailsItem>
                          </DL>
                        </GridItem>
                        <GridItem md={6}>
                          <DL className="co-m-pane__details">
                            <DetailsItem label={t('Availability')} obj={routing}>
                              <Label color={available?.status === 'True' ? 'green' : 'red'}>
                                {available?.status || t('Unknown')}
                              </Label>
                            </DetailsItem>
                          </DL>
                        </GridItem>
                      </Grid>
                    </GridItem>
                  </Grid>
                </GridItem>
              );
            })}
          </Grid>
        </>
      )}
    </>
  );
};

export default CUDNNamespaceMembership;
