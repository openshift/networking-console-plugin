import React, { FC } from 'react';
import { Link } from 'react-router';

import { DocumentTitle } from '@openshift-console/dynamic-plugin-sdk';
import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  ContentVariants,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import Topology from '@views/topology/components/Topology';
import { TopologyContextProvider } from '@views/topology/context/TopologyContext';
import useNetworkTopologyResources from '@views/topology/hooks/useNetworkTopologyResources';

import './TopologyPage.scss';

const TopologyPage: FC = ({}) => {
  const { t } = useNetworkingTranslation();
  const { loaded, resources } = useNetworkTopologyResources();

  return (
    <>
      <DocumentTitle>{t('Topology')}</DocumentTitle>
      <div className="networking-topology__layout">
        <div className="networking-topology__sticky-header">
          <PageSection className="networking-topology__header" hasBodyWrapper={false}>
            <Breadcrumb>
              <BreadcrumbItem>
                {/* TODO: Fix URL */}
                <Link to={`/k8s/`}>{t('Networking')}</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{t('Topology')}</BreadcrumbItem>
            </Breadcrumb>
            <Title headingLevel="h1">{t('Topology')}</Title>
            <Content component={ContentVariants.p}>
              {t(
                'Visualize, scale, and manage your cluster topology. Right-click the canvas for additional actions.',
              )}
            </Content>
          </PageSection>
        </div>
        <PageSection
          className="networking-topology__topology-content"
          hasBodyWrapper={false}
          isFilled
        >
          <TopologyContextProvider resources={resources} resourcesLoaded={loaded}>
            <Topology />
          </TopologyContextProvider>
        </PageSection>
      </div>
    </>
  );
};

export default TopologyPage;
