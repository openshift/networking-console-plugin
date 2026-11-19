import React, { FC, ReactNode } from 'react';

import { modelToGroupVersionKind } from '@kubevirt-ui-ext/kubevirt-api/console';
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
import { RouteAdvertisementsModel } from '@utils/models';
import { BGP_ROUTE_ADVERTISEMENTS_NAME } from '@utils/resources/bgp/constants';
import { BGPCloudConfiguration } from '@utils/resources/bgp/types';
import { condition } from '@utils/resources/bgp/utils';
import { getName } from '@utils/resources/shared';

import { BGPStatus, Conditions } from '../../components/BGPStatus';

const BGPCloudConfigurationDetailsTab: FC<{ obj?: BGPCloudConfiguration }> = ({ obj }) => {
  const { t } = useNetworkingTranslation();
  const available = condition(obj?.status?.conditions);
  const routerSelector = obj?.spec?.routerNodeSelector || {};
  const hasRouterSelector = Object.keys(routerSelector).length > 0;
  const [routerNodes, routerNodesLoaded, routerNodesError] = useK8sWatchResource<K8sResourceKind[]>(
    obj && hasRouterSelector
      ? {
          groupVersionKind: { group: '', kind: 'Node', version: 'v1' },
          isList: true,
          selector: { matchLabels: routerSelector },
        }
      : null,
  );

  if (!obj) return null;

  let routerNodesContent: ReactNode;
  if (!hasRouterSelector) {
    routerNodesContent = (
      <Alert isInline title={t('No router node selector configured')} variant={AlertVariant.info}>
        {t('Configure a router node selector to see matching nodes.')}
      </Alert>
    );
  } else if (routerNodesError) {
    routerNodesContent = (
      <Alert
        isInline
        title={t('Unable to load matching router nodes')}
        variant={AlertVariant.warning}
      >
        {routerNodesError.message || t('The router node query could not be completed.')}
      </Alert>
    );
  } else if (!routerNodesLoaded) {
    routerNodesContent = <Loading />;
  } else if (routerNodes?.length) {
    routerNodesContent = (
      <DL>
        <DetailsItem label={t('Nodes')} obj={obj}>
          <LabelGroup>
            {routerNodes.map((node) => (
              <Label color="blue" key={getName(node)} variant="outline">
                <ResourceLink kind="Node" name={getName(node)} />
              </Label>
            ))}
          </LabelGroup>
        </DetailsItem>
      </DL>
    );
  } else {
    routerNodesContent = (
      <Alert isInline title={t('No router nodes match the selector')} variant={AlertVariant.info}>
        {t('No nodes currently match the configured router node selector.')}
      </Alert>
    );
  }

  return (
    <PageSection>
      <Grid hasGutter>
        <GridItem md={6}>
          <DetailsSectionTitle titleText={t('Configuration')} />
          <DL className="co-m-pane__details" data-test-id="resource-summary">
            <DetailsItem label={t('Name')} obj={obj} path="metadata.name" />
            <DetailsItem label={t('Platform')} obj={obj} path="spec.platform" />
            <DetailsItem label={t('Local ASN')} obj={obj} path="spec.bgp.localASN" />
            <DetailsItem
              defaultValue="bgp-keepalive"
              label={t('Liveness detection')}
              obj={obj}
              path="spec.bgp.livenessDetection"
            />
            <DetailsItem label={t('Router node selector')} obj={obj}>
              <LabelGroup>
                {Object.entries(obj.spec?.routerNodeSelector || {}).map(([key, value]) => (
                  <Label color="blue" key={key}>
                    {key}={value}
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
            <DetailsItem label={t('Matching router nodes')} obj={obj}>
              {routerNodes?.length || 0}
            </DetailsItem>
          </DL>
        </GridItem>
      </Grid>
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Matching router nodes')} />
      {routerNodesContent}
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Discovered peer groups')} />
      {obj.status?.peerGroups?.length ? (
        <Grid hasGutter>
          {obj.status.peerGroups.map((group) => (
            <GridItem key={group.key} md={6}>
              <DL className="co-m-pane__details">
                <DetailsItem label={t('Group')} obj={obj}>
                  {group.key}
                </DetailsItem>
                <DetailsItem label={t('Selected nodes')} obj={obj}>
                  <LabelGroup>
                    {Object.entries(group.nodeSelector || {}).map(([key, value]) => (
                      <Label color="blue" key={key}>
                        {key}={value}
                      </Label>
                    ))}
                  </LabelGroup>
                </DetailsItem>
                <DetailsItem label={t('Neighbors')} obj={obj}>
                  <LabelGroup>
                    {group.neighbors?.map((neighbor) => (
                      <Label color="teal" key={`${neighbor.address}-${neighbor.remoteASN}`}>
                        {neighbor.address} (AS{neighbor.remoteASN})
                      </Label>
                    ))}
                  </LabelGroup>
                </DetailsItem>
              </DL>
            </GridItem>
          ))}
        </Grid>
      ) : (
        <Alert isInline title={t('No peer groups discovered')} variant={AlertVariant.info}>
          {t('Peer groups will appear here after the cloud configuration is reconciled.')}
        </Alert>
      )}
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Network resources')} />
      <DL>
        <DetailsItem label={t('RouteAdvertisements')} obj={obj}>
          <ResourceLink
            groupVersionKind={modelToGroupVersionKind(RouteAdvertisementsModel)}
            name={BGP_ROUTE_ADVERTISEMENTS_NAME}
          />
        </DetailsItem>
      </DL>
      <DetailsSectionTitle className="pf-v6-u-mt-xl" titleText={t('Conditions')} />
      <Conditions conditions={obj.status?.conditions} />
    </PageSection>
  );
};

export default BGPCloudConfigurationDetailsTab;
