import React, { FC } from 'react';

import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getReferenceForModel, IngressModel } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { Ingress } from '@utils/types/k8sTypes';
import IngressActions from '@views/ingresses/actions/IngressActions';

type IngressDetailsPageTitleProps = {
  ingress: Ingress;
};

const IngressDetailsPageTitle: FC<IngressDetailsPageTitleProps> = ({ ingress }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <DetailsPageTitle
      breadcrumbs={[
        { name: t('Ingresses'), to: `/k8s/${namespacePath}/${getReferenceForModel(IngressModel)}` },
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
