import React, { FC } from 'react';

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Grid,
  GridItem,
  PageSection,
} from '@patternfly/react-core';
import Area from '@utils/components/Area/Area';
import { useIsAdmin } from '@utils/hooks/useIsAdmin';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';

import { humanizeDecimalBytesPerSec } from '../../../../../../utils/utils/units';

type RouteMetricsTabProps = {
  obj: RouteKind;
};

const RouteMetricsTab: FC<RouteMetricsTabProps> = ({ obj: route }) => {
  const { t } = useNetworkingTranslation();
  const isAdmin = useIsAdmin();

  if (!isAdmin) return null;

  const namespaceRouteQuery = `{exported_namespace="${getNamespace(route)}",route="${getName(route)}"}[5m]`;

  return (
    <PageSection data-test-id="dashboard">
      <Grid hasGutter>
        <GridItem lg={12} xl={6}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('Traffic in')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                humanize={humanizeDecimalBytesPerSec}
                query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_in_total${namespaceRouteQuery}))`}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem lg={12} xl={6}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('Traffic out')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                humanize={humanizeDecimalBytesPerSec}
                query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_out_total${namespaceRouteQuery}))`}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem lg={12} xl={6}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('Connection rate')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_backend_connections_total${namespaceRouteQuery}))`}
              />
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default RouteMetricsTab;
