import React, { FC } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { documentationURLs, getDocumentationURL } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { SOFTWARE_CATALOG_NMSTATE_PATH } from '../utils/constants';

type NMStateGuidanceProps = {
  canInstallOperators: boolean;
};

const NMStateGuidance: FC<NMStateGuidanceProps> = ({ canInstallOperators }) => {
  const { t } = useNetworkingTranslation();

  return (
    <Card className="pf-v6-u-mb-lg" isPlain>
      <CardHeader>
        <CardTitle component="h2">{t('Manage host-network configuration with NMState')}</CardTitle>
      </CardHeader>
      <CardBody>
        {t(
          'Install the Kubernetes NMState Operator to configure node networks and view policy rollout status. Existing host networking may already be configured through other tools.',
        )}
        <Flex className="pf-v6-u-mt-md" spaceItems={{ default: 'spaceItemsMd' }}>
          {canInstallOperators && (
            <FlexItem>
              <Button component="a" href={SOFTWARE_CATALOG_NMSTATE_PATH} variant="link">
                {t('Install NMState Operator')}
              </Button>
            </FlexItem>
          )}
          <FlexItem>
            <ExternalLink href={getDocumentationURL(documentationURLs.nmstateOperator)}>
              {t('View documentation')}
            </ExternalLink>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default NMStateGuidance;
