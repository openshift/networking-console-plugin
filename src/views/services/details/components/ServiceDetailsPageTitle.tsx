import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { modelToRef, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Breadcrumb, BreadcrumbItem, Title } from '@patternfly/react-core';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import ServiceActions from '@views/services/actions/ServiceActions';

type ServicePageTitleProps = {
  service: IoK8sApiCoreV1Service;
};

const ServicePageTitle: FC<ServicePageTitleProps> = ({ service }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <div className="co-m-nav-title co-m-nav-title--detail">
      <div>
        <Breadcrumb className="pf-c-breadcrumb co-breadcrumb">
          <BreadcrumbItem>
            <Link to={`/k8s/${namespacePath}/${modelToRef(ServiceModel)}`}>{t('Services')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>{t('Service details')}</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <span className="co-m-pane__heading">
        <Title headingLevel="h1">
          <span
            className="co-m-resource-icon co-m-resource-service co-m-resource-icon--lg"
            title="Service"
          >
            {t('S')}
          </span>
          {service?.metadata?.name}
        </Title>
        <ServiceActions obj={service} />
      </span>
    </div>
  );
};

export default ServicePageTitle;
