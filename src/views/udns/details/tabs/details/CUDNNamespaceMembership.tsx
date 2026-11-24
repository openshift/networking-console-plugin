import React, { FC, ReactNode } from 'react';

import {
  modelToGroupVersionKind,
  NamespaceModel,
  PodModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  K8sResourceCommon,
  K8sResourceKind,
  useK8sModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, DescriptionList as DL, Grid, GridItem } from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRoutingModel, BGPRoutingModelGroupVersionKind } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp/types';
import { getName, resourceListPathFromModel } from '@utils/resources/shared';
import { getCUDNProjects, udnIsReady } from '@utils/resources/udns/helper';
import { getUDNConditions } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import { isEmpty } from '@utils/utils';

import CUDNBGPDetails from './components/CUDNBGPDetails';
import { getMembershipContent, getSelectorContent, getSelectorEntries } from './utils';

type CUDNNamespaceMembershipProps = {
  cudn: ClusterUserDefinedNetworkKind;
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
    (routing) => `cluster-udn-${routing.spec?.network?.name}` === cudn.metadata?.name,
  );
  const conditions = getUDNConditions(cudn);
  const noMatchingNamespaces =
    namespacesLoaded && !namespacesError && matchingNamespaces.length === 0;
  const networkReady = udnIsReady(cudn);
  const readinessCondition = networkReady
    ? undefined
    : conditions.find(
        (udnCondition) =>
          (udnCondition.type === 'NetworkCreated' ||
            udnCondition.type === 'NetworkAllocationSucceeded') &&
          udnCondition.status !== 'True',
      );
  let podCount: ReactNode = t('Loading');
  if (namespacesError || podsError) podCount = t('Unavailable');
  else if (namespacesLoaded && podsLoaded) podCount = matchingPodCount;
  const selectorEntries = getSelectorEntries(selector);
  const selectorContent = getSelectorContent(namespaceListLink, selectorEntries, t);
  const membershipContent = getMembershipContent({
    cudn,
    matchingNamespaces,
    namespacesError,
    namespacesLoaded,
    selectorEntries,
    t,
  });

  return (
    <>
      <Alert
        className="pf-v6-u-mt-md"
        isInline
        title={networkReady ? t('Network is ready') : t('Network is not ready')}
        variant={networkReady ? AlertVariant.success : AlertVariant.warning}
      >
        {readinessCondition?.message ||
          (networkReady
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
        <CUDNBGPDetails routings={relatedRoutings} />
      )}
    </>
  );
};

export default CUDNNamespaceMembership;
