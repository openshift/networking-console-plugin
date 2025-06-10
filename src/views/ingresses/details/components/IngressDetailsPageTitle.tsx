import React, { FC } from 'react';

import { IngressModel, modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1Ingress } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import IngressActions from '@views/ingresses/actions/IngressActions';

type IngressDetailsPageTitleProps = {
  ingress: IoK8sApiNetworkingV1Ingress;
};

const IngressDetailsPageTitle: FC<IngressDetailsPageTitleProps> = ({ ingress }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('Ingresses'), to: `/k8s/${namespacePath}/${modelToRef(IngressModel)}` },
        { name: t('Ingress details') },
      ]}
    >
      <Title className="co-resource-item__resource-name" headingLevel="h1">
        <span className="co-m-resource-icon co-m-resource-ingress co-m-resource-icon--lg">
          {IngressModel.abbr}
        </span>
        {getName(ingress)}
      </Title>
      <IngressActions ingress={ingress} />
    </DetailsPageTitle>
  );
};

export default IngressDetailsPageTitle;
