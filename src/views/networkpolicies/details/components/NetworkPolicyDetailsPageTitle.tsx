import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getPolicyModel } from '@utils/resources/networkpolicies/utils';
import NetworkPolicyActions from '@views/networkpolicies/actions/NetworkPolicyActions';

type NetworkAttachmentDefinitionPageTitleProps = {
  networkPolicy: IoK8sApiNetworkingV1NetworkPolicy;
};

const NetworkAttachmentDefinitionPageTitle: FC<NetworkAttachmentDefinitionPageTitleProps> = ({
  networkPolicy,
}) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  const policyModel = getPolicyModel(networkPolicy);

  return (
    <PageSection>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to={`/k8s/${namespacePath}/${modelToRef(policyModel)}`}>{policyModel.kind}</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{t('{{kind}} details', { kind: policyModel.kind })}</BreadcrumbItem>
      </Breadcrumb>
      <Stack hasGutter>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h1">
              <span className="co-m-resource-icon co-m-resource-icon--lg">
                {t(policyModel.abbr)}
              </span>{' '}
              {networkPolicy?.metadata?.name}
            </Title>
          </FlexItem>
          <FlexItem>
            <NetworkPolicyActions obj={networkPolicy} />
          </FlexItem>
        </Flex>
      </Stack>
    </PageSection>
  );
};

export default NetworkAttachmentDefinitionPageTitle;
