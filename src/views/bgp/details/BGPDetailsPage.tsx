import React, { FC, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router';

import {
  modelToGroupVersionKind,
  modelToRef,
  NamespaceModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import type { K8sResourceKind, WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk';
import {
  HorizontalNav,
  ListPageBody,
  ResourceLink,
  ResourceYAMLEditor,
  RowProps,
  TableColumn,
  TableData,
  useDeleteModal,
  useK8sWatchResource,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
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
  Title,
} from '@patternfly/react-core';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import Loading from '@utils/components/Loading/Loading';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  BGPCloudConfigurationModel,
  BGPRoutingModel,
  ClusterUserDefinedNetworkModel,
  FRRConfigurationModel,
  RouteAdvertisementsModel,
} from '@utils/models';
import {
  BGP_ROUTE_ADVERTISEMENTS_NAME,
  BGPCloudConfiguration,
  BGPRouting,
  condition,
} from '@utils/resources/bgp';
import { asAccessReview } from '@utils/resources/shared';

import { BGPStatus, Conditions } from '../components/BGPStatus';
import { shouldHideBGPResourceTabs } from '../olm';

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

  let routerNodesContent: React.ReactNode;
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
              <Label color="blue" key={node.metadata?.name} variant="outline">
                <ResourceLink kind="Node" name={node.metadata?.name} />
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
              <BGPStatus condition={available} phase={available?.status} />
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

  let namespaceContent: React.ReactNode;
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
              <BGPStatus condition={available} phase={available?.status} />
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

const BGPCloudConfigurationYAML: FC<{ obj?: BGPCloudConfiguration }> = ({ obj }) => {
  if (!obj) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={obj} />
    </Suspense>
  );
};

const GeneratedResourceRow: FC<
  { model: typeof FRRConfigurationModel } & RowProps<K8sResourceKind>
> = ({ activeColumnIDs, model, obj }) => (
  <>
    <TableData activeColumnIDs={activeColumnIDs} id="name">
      <ResourceLink
        groupVersionKind={modelToGroupVersionKind(model)}
        name={obj.metadata?.name}
        namespace={model.namespaced ? obj.metadata?.namespace : undefined}
      />
    </TableData>
    {model.namespaced && (
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        {obj.metadata?.namespace || '-'}
      </TableData>
    )}
  </>
);

const GeneratedResourcesTab: FC<{
  model: typeof FRRConfigurationModel;
  title: string;
  watchOptions?: Pick<WatchK8sResource, 'fieldSelector' | 'namespace' | 'selector'>;
}> = ({ model, title, watchOptions }) => {
  const { t } = useNetworkingTranslation();
  const [resources, loaded, error] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: modelToGroupVersionKind(model),
    isList: true,
    ...watchOptions,
  });
  const columns = [
    { id: 'name', title: t('Name') },
    ...(model.namespaced ? [{ id: 'namespace', title: t('Namespace') }] : []),
  ] as TableColumn<K8sResourceKind>[];

  return (
    <PageSection>
      <DetailsSectionTitle titleText={title} />
      <ListPageBody>
        <VirtualizedTable
          columns={columns}
          data={resources || []}
          loaded={loaded}
          loadError={error}
          Row={(props) => <GeneratedResourceRow {...props} model={model} />}
          unfilteredData={resources || []}
        />
      </ListPageBody>
    </PageSection>
  );
};

const FRRConfigurationsTab: FC = () => {
  const { t } = useNetworkingTranslation();
  return (
    <GeneratedResourcesTab
      model={FRRConfigurationModel}
      title={t('FRRConfigurations')}
      watchOptions={{
        namespace: 'openshift-frr-k8s',
        selector: { matchLabels: { 'app.kubernetes.io/managed-by': 'bgp-cloud-connector' } },
      }}
    />
  );
};

const BGPRoutingYAML: FC<{ obj?: BGPRouting }> = ({ obj }) => {
  if (!obj) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={obj} />
    </Suspense>
  );
};

const BGPDetailsActions: FC<{
  model: typeof BGPCloudConfigurationModel;
  obj: BGPCloudConfiguration | BGPRouting;
}> = ({ model, obj }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const launchDeleteModal = useDeleteModal(obj);
  const resourcePath = `/k8s/cluster/${modelToRef(model)}/${obj.metadata?.name}`;
  const actions = [
    {
      accessReview: asAccessReview(model, obj, 'update'),
      cta: () => navigate(`${resourcePath}/form`),
      id: 'edit-bgp-resource',
      label: t('Edit {{kind}}', { kind: model.kind }),
    },
    {
      accessReview: asAccessReview(model, obj, 'delete'),
      cta: launchDeleteModal,
      id: 'delete-bgp-resource',
      label: t('Delete {{kind}}', { kind: model.kind }),
    },
  ];
  return <ActionsDropdown actions={actions} id="bgp-resource-actions" isKebabToggle={false} />;
};

const BGPCloudConfigurationPageTitle: FC<{ obj?: BGPCloudConfiguration }> = ({ obj }) => {
  const { t } = useNetworkingTranslation();
  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('BGP'), to: `/k8s/cluster/${modelToRef(BGPCloudConfigurationModel)}` },
        { name: t('{{kind}} details', { kind: BGPCloudConfigurationModel.kind }) },
      ]}
    >
      <Title headingLevel="h1">
        <span
          className="co-m-resource-icon co-m-resource-icon--lg"
          title={BGPCloudConfigurationModel.abbr}
        >
          {BGPCloudConfigurationModel.abbr}
        </span>
        {obj?.metadata?.name}
      </Title>
      {obj && <BGPDetailsActions model={BGPCloudConfigurationModel} obj={obj} />}
    </DetailsPageTitle>
  );
};

const BGPRoutingPageTitle: FC<{ obj?: BGPRouting }> = ({ obj }) => {
  const { t } = useNetworkingTranslation();
  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('BGP'), to: `/k8s/cluster/${modelToRef(BGPRoutingModel)}` },
        { name: t('{{kind}} details', { kind: BGPRoutingModel.kind }) },
      ]}
    >
      <Title headingLevel="h1">
        <span className="co-m-resource-icon co-m-resource-icon--lg" title={BGPRoutingModel.abbr}>
          {BGPRoutingModel.abbr}
        </span>
        {obj?.metadata?.name}
      </Title>
      {obj && <BGPDetailsActions model={BGPRoutingModel} obj={obj} />}
    </DetailsPageTitle>
  );
};

export const BGPCloudConfigurationDetailsPage: FC<{ name: string }> = ({ name }) => {
  const { t } = useNetworkingTranslation();
  const { pathname } = useLocation();
  const [obj, loaded, error] = useK8sWatchResource<BGPCloudConfiguration>({
    groupVersionKind: modelToGroupVersionKind(BGPCloudConfigurationModel),
    name,
  });
  const pages = [
    { component: BGPCloudConfigurationDetailsTab, href: '', name: t('Details') },
    { component: FRRConfigurationsTab, href: 'frrconfigurations', name: t('FRRConfigurations') },
    { component: BGPCloudConfigurationYAML, href: 'yaml', name: t('YAML') },
  ];
  return (
    <StatusBox error={error} loaded={loaded}>
      <BGPCloudConfigurationPageTitle obj={obj} />
      {!shouldHideBGPResourceTabs(pathname) && <HorizontalNav pages={pages} resource={obj} />}
    </StatusBox>
  );
};

export const BGPRoutingDetailsPage: FC<{ name: string }> = ({ name }) => {
  const { t } = useNetworkingTranslation();
  const { pathname } = useLocation();
  const [obj, loaded, error] = useK8sWatchResource<BGPRouting>({
    groupVersionKind: modelToGroupVersionKind(BGPRoutingModel),
    name,
  });
  const pages = [
    { component: BGPRoutingDetailsTab, href: '', name: t('Details') },
    { component: BGPRoutingYAML, href: 'yaml', name: t('YAML') },
  ];
  return (
    <StatusBox error={error} loaded={loaded}>
      <BGPRoutingPageTitle obj={obj} />
      {!shouldHideBGPResourceTabs(pathname) && <HorizontalNav pages={pages} resource={obj} />}
    </StatusBox>
  );
};
