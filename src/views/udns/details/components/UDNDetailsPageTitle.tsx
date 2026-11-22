import React, { FC } from 'react';
import { useLocation } from 'react-router';

import { modelToRef } from '@kubevirt-ui-ext/kubevirt-api/console';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getNamespace } from '@utils/resources/shared';
import { getModel } from '@utils/resources/udns/selectors';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import UDNActions from '@views/udns/actions/UDNActions';

type UDNDetailsPageTitleProps = {
  udn: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
};

const UDNDetailsPageTitle: FC<UDNDetailsPageTitleProps> = ({ udn }) => {
  const { t } = useNetworkingTranslation();
  const model = getModel(udn);
  const namespace = getNamespace(udn);
  const cameFromTopology = Boolean(useLocation().state?.fromTopology);
  const topologyPath = namespace
    ? `/k8s/ns/${namespace}/networking-topology`
    : '/k8s/all-namespaces/networking-topology';

  return (
    <DetailsPageTitle
      breadcrumbs={[
        ...(cameFromTopology ? [{ name: t('Topology'), to: topologyPath }] : []),
        {
          name: t('UserDefinedNetworks'),
          to: `/k8s/all-namespaces/${modelToRef(model)}`,
        },
        {
          name: t('{{kind}} details', { kind: model.kind }),
        },
      ]}
    >
      <Title headingLevel="h1">
        <span className="co-m-resource-icon co-m-resource-icon--lg" title={model.abbr}>
          {model.abbr}
        </span>
        {udn?.metadata?.name}
      </Title>
      {udn && <UDNActions isKebabToggle={false} obj={udn} />}
    </DetailsPageTitle>
  );
};

export default UDNDetailsPageTitle;
