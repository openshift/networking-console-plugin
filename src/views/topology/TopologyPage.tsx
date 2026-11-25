import React, { FC } from 'react';

import { DocumentTitle, useActiveNamespace, useFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  Content,
  ContentVariants,
  PageSection,
  Title,
} from '@patternfly/react-core';
import { FLAG_NMSTATE_CRDS } from '@utils/flags/consts';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { SOFTWARE_CATALOG_NMSTATE_PATH } from '@views/physical-networks/utils/constants';
import Topology from '@views/topology/components/Topology';
import { TopologyContextProvider } from '@views/topology/context/TopologyContext';
import useNetworkTopologyResources from '@views/topology/hooks/useNetworkTopologyResources';

import './TopologyPage.scss';

const TopologyPage: FC = () => {
  const { t } = useNetworkingTranslation();
  const [activeNamespace] = useActiveNamespace();
  const nmstateAvailable = useFlag(FLAG_NMSTATE_CRDS);
  const { loaded, resources } = useNetworkTopologyResources();

  return (
    <>
      <Alert
        className="pf-v6-u-mt-md"
        isInline
        title={t('The configuration topology is a Technical Preview feature')}
        variant="info"
      />
      <DocumentTitle>{t('Topology')}</DocumentTitle>
      <div className="networking-topology__layout">
        <div className="networking-topology__sticky-header">
          <PageSection className="networking-topology__header" hasBodyWrapper={false}>
            <Title headingLevel="h1">{t('Topology')}</Title>
            <Content component={ContentVariants.p}>
              {t(
                'Visualize, scale, and manage your cluster topology. Right-click the canvas for additional actions.',
              )}
            </Content>
            {!nmstateAvailable && (
              <Alert
                className="pf-v6-u-mt-md"
                isInline
                title={t('Kubernetes NMState Operator is not installed.')}
                variant="warning"
              >
                {t(
                  'Install the Kubernetes NMState Operator to discover host-network attachments and reconcile node network state.',
                )}{' '}
                <Button component="a" href={SOFTWARE_CATALOG_NMSTATE_PATH} isInline variant="link">
                  {t('Install NMState Operator')}
                </Button>
              </Alert>
            )}
          </PageSection>
        </div>
        <PageSection
          className="networking-topology__topology-content"
          hasBodyWrapper={false}
          isFilled
        >
          <TopologyContextProvider
            activeNamespace={activeNamespace}
            nmstateAvailable={nmstateAvailable}
            resources={resources}
            resourcesLoaded={loaded}
          >
            <Topology />
          </TopologyContextProvider>
        </PageSection>
      </div>
    </>
  );
};

export default TopologyPage;
