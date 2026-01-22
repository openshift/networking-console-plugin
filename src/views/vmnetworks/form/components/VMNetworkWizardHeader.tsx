import React, { FC } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

import { Flex, Title } from '@patternfly/react-core';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const VMNetworkWizardHeader: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <div className="pf-v6-c-wizard__header">
      <div className="pf-v6-c-wizard__title">
        <Flex>
          <h1 className="pf-v6-c-wizard__title-text">{t('Create virtual machine network')}</h1>
          <Title className="pf-v6-u-text-color-subtle" headingLevel="h2">
            {t('OVN Localnet')}
          </Title>
        </Flex>
      </div>
      <div className="pf-v6-c-wizard__description">
        <Trans t={t}>
          Define a virtual network providing access to the physical underlay through a selected node
          network mapping. Learn more about{' '}
          <Link
            rel="noreferrer"
            target="_blank"
            to={getDocumentationURL(documentationURLs.vmNetworking)}
          >
            virtual machine networks
          </Link>
          .
        </Trans>
      </div>
    </div>
  );
};

export default VMNetworkWizardHeader;
