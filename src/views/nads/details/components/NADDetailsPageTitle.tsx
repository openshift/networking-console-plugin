import React, { FC } from 'react';

import {
  modelToRef,
  NetworkAttachmentDefinitionModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getNamespace } from '@utils/resources/shared';
import NADActions from '@views/nads/actions/NADActions';

type NADDetailsPageTitleProps = {
  nad: NetworkAttachmentDefinitionKind;
};

const NADDetailsPageTitle: FC<NADDetailsPageTitleProps> = ({ nad }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();
  const namespace = getNamespace(nad);

  return (
    <DetailsPageTitle
      breadcrumbs={[
        {
          name: t('Topology'),
          to: `/k8s/ns/${namespace}/networking-topology`,
        },
        {
          name: t('NetworkAttachmentDefinitions'),
          to: `/k8s/${namespacePath}/${modelToRef(NetworkAttachmentDefinitionModel)}`,
        },
        {
          name: t('{{kind}} details', { kind: NetworkAttachmentDefinitionModel.kind }),
        },
      ]}
    >
      <Title headingLevel="h1">
        <span className="co-m-resource-icon co-m-resource-icon--lg" title="NAD">
          {NetworkAttachmentDefinitionModel.abbr}
        </span>
        {nad?.metadata?.name}
      </Title>
      <NADActions obj={nad} />
    </DetailsPageTitle>
  );
};

export default NADDetailsPageTitle;
