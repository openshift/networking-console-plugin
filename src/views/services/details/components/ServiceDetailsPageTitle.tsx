import React, { FC } from 'react';

import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getReferenceForModel, ServiceModel } from '@utils/models';
import { Service } from '@utils/types/k8sTypes';
import ServiceActions from '@views/services/actions/ServiceActions';

type ServicePageTitleProps = {
  service: Service;
};

const ServicePageTitle: FC<ServicePageTitleProps> = ({ service }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('Services'), to: `/k8s/${namespacePath}/${getReferenceForModel(ServiceModel)}` },
        { name: t('Service details') },
      ]}
    >
      <Title headingLevel="h1">
        <span
          className="co-m-resource-icon co-m-resource-service co-m-resource-icon--lg"
          title="Service"
        >
          {ServiceModel.abbr}
        </span>
        {service?.metadata?.name}
      </Title>
      <ServiceActions obj={service} />
    </DetailsPageTitle>
  );
};

export default ServicePageTitle;
