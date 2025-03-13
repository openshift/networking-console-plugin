import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { IngressModel, modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
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
import { getName } from '@utils/resources/shared';
import IngressActions from '@views/ingresses/actions/IngressActions';

import './IngressDetailsPageTitle.scss';

type IngressDetailsPageTitleProps = {
  ingress: IoK8sApiNetworkingV1Ingress;
};

const IngressDetailsPageTitle: FC<IngressDetailsPageTitleProps> = ({ ingress }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <PageSection className="co-m-nav-title--detail">
      <Breadcrumb className="pf-c-breadcrumb co-breadcrumb ingress-details-breadcrumbs">
        <BreadcrumbItem>
          <Link to={`/k8s/${namespacePath}/${modelToRef(IngressModel)}`}>{t('Ingresses')}</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{t('Ingress details')}</BreadcrumbItem>
      </Breadcrumb>
      <Stack hasGutter>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title className="co-resource-item__resource-name" headingLevel="h1">
              <span className="co-m-resource-icon co-m-resource-icon--lg">
                {t(IngressModel?.abbr)}
              </span>
              {getName(ingress)}
            </Title>
          </FlexItem>
          <FlexItem>
            <IngressActions ingress={ingress} />
          </FlexItem>
        </Flex>
      </Stack>
    </PageSection>
  );
};

export default IngressDetailsPageTitle;
