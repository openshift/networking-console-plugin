import React, { FC } from 'react';

import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getReferenceForModel } from '@utils/models';
import { getPolicyModel } from '@utils/resources/networkpolicies/utils';
import { NetworkPolicy } from '@utils/types/k8sTypes';
import NetworkPolicyActions from '@views/networkpolicies/actions/NetworkPolicyActions';

type NetworkAttachmentDefinitionPageTitleProps = {
  networkPolicy: NetworkPolicy;
};

const NetworkAttachmentDefinitionPageTitle: FC<NetworkAttachmentDefinitionPageTitleProps> = ({
  networkPolicy,
}) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  const policyModel = getPolicyModel(networkPolicy);

  return (
    <DetailsPageTitle
      breadcrumbs={[
        {
          name: policyModel.kind,
          to: `/k8s/${namespacePath}/${getReferenceForModel(policyModel)}`,
        },
        { name: t('{{kind}} details', { kind: policyModel.kind }) },
      ]}
    >
      <Title headingLevel="h1">
        <span className="co-m-resource-icon co-m-resource-icon--lg">{t(policyModel.abbr)}</span>
        {networkPolicy?.metadata?.name}
      </Title>
      <NetworkPolicyActions obj={networkPolicy} />
    </DetailsPageTitle>
  );
};

export default NetworkAttachmentDefinitionPageTitle;
