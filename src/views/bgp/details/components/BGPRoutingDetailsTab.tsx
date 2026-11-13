import React, { FC, ReactNode } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import type { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { ResourceLink, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  DescriptionList as DL,
  Grid,
  GridItem,
  Label,
  LabelGroup,
  PageSection,
  Timestamp,
} from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel, RouteAdvertisementsModel } from '@utils/models';
import { BGP_ROUTE_ADVERTISEMENTS_NAME } from '@utils/resources/bgp/constants';
import { BGPRouting } from '@utils/resources/bgp/types';
import { condition } from '@utils/resources/bgp/utils';
import { getName } from '@utils/resources/shared';

import { BGPStatus, Conditions } from '../../components/BGPStatus';

const BGPRoutingDetailsTab: FC<{ obj?: BGPRouting }> = ({ obj }) => {
  const { t } = useNetworkingTranslation();
  const available = condition(obj?.status?.conditions);
  const networkName = obj?.spec?.network?.name;
  const cudnName = networkName ? `cluster-udn-${networkName}` : undefined;
  const [namespaces, namespacesLoaded, namespacesError] = useK8sWatchResource<K8sResourceKind[]>(
    networkName
      ? {
          groupVersionKind: modelToGroupVersionKind(NamespaceModel),
          isList: true,
          selector: {
            matchLabels: {
              'cluster-udn': networkName,
              'k8s.ovn.org/primary-user-defined-network': '',
            },
          },
        }
      : null,
  );

  let namespaceContent: ReactNode;
  if (namespacesError) {
    namespaceContent = (
      <Alert
        isInline
        title={t('Unable to load matching namespaces')}
        variant={AlertVariant.warning}
      >
        {namespacesError.message || t('The namespace membership query could not be completed.')}
      </Alert>
    );
  } else if (!namespacesLoaded) {
    namespaceContent = <Loading />;
  } else if (namespaces?.length) {
    namespaceContent = (
      <DL>
        <DetailsItem label={t('Namespaces')} obj={obj}>
          <LabelGroup>
            {namespaces.map((namespace) => (
              <Label color="blue" key={getName(namespace)} variant="outline">
                <ResourceLink
                  groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
                  name={getName(namespace)}
                />
              </Label>
            ))}
          </LabelGroup>
        </DetailsItem>
      </DL>
    );
  } else {
    namespaceContent = (
      <Alert isInline title={t('No namespaces are selected')} variant={AlertVariant.info}>
        {t('No namespaces match the required labels for network {{network}}.', {
          network: networkName,
        })}
      </Alert>
    );
  }

  if (!obj) return null;

  return (
    <PageSection>
      {(available?.status !== 'True' || !available) && (
        <Alert
          className="pf-v6-u-mb-xl"
          isInline
          title={t('BGP routing is not ready')}
          variant={AlertVariant.warning}
        >
          {available?.message ||
            t('Check that BGPCloudConfiguration named cluster exists and is Ready.')}
        </Alert>
      )}
      <Grid hasGutter>
        <GridItem md={6}>
          <DetailsSectionTitle titleText={t('Routing configuration')} />
          <DL className="co-m-pane__details" data-test-id="resource-summary">
            <DetailsItem label={t('Name')} obj={obj} path="metadata.name" />
            <DetailsItem label={t('Network')} obj={obj} path="spec.network.name" />
            <DetailsItem label={t('Advertised subnets')} obj={obj}>
              <LabelGroup>
                {obj.spec?.network?.subnets?.map((subnet) => (
                  <Label color="blue" key={subnet}>
                    {subnet}
                  </Label>
                ))}
              </LabelGroup>
            </DetailsItem>
            <DetailsItem label={t('Created at')} obj={obj} path="metadata.creationTimestamp">
              <Timestamp timestamp={obj.metadata?.creationTimestamp} />
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={6}>
          <DetailsSectionTitle titleText={t('Status')} />
          <DL>
            <DetailsItem label={t('Phase')} obj={obj}>
              <BGPStatus condition={available} phase={obj.status?.phase} />
            </DetailsItem>
            <DetailsItem label={t('Availability')} obj={obj}>
              <Label color={available?.status === 'True' ? 'green' : 'red'}>
                {available?.status || t('Unknown')}
              </Label>
            </DetailsItem>
            <DetailsItem
              label={t('Observed generation')}
              obj={obj}
              path="status.observedGeneration"
            />
          </DL>
        </GridItem>
      </Grid>
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Selected namespaces')} />
      {namespaceContent}
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Network resources')} />
      <Grid hasGutter>
        <GridItem md={6}>
          <DL>
            <DetailsItem label={t('ClusterUserDefinedNetwork')} obj={obj}>
              {cudnName && (
                <ResourceLink
                  groupVersionKind={modelToGroupVersionKind(ClusterUserDefinedNetworkModel)}
                  name={cudnName}
                />
              )}
            </DetailsItem>
          </DL>
        </GridItem>
        <GridItem md={6}>
          <DL>
            <DetailsItem label={t('RouteAdvertisements')} obj={obj}>
              <ResourceLink
                groupVersionKind={modelToGroupVersionKind(RouteAdvertisementsModel)}
                name={BGP_ROUTE_ADVERTISEMENTS_NAME}
              />
            </DetailsItem>
          </DL>
        </GridItem>
      </Grid>
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Conditions')} />
      <Conditions conditions={obj.status?.conditions} />
    </PageSection>
  );
};

export default BGPRoutingDetailsTab;
