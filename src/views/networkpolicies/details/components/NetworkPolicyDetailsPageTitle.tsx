import React, { FC } from 'react';

import { modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
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
    <DetailsPageTitle
      breadcrumbs={[
        { name: policyModel.kind, to: `/k8s/${namespacePath}/${modelToRef(policyModel)}` },
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
