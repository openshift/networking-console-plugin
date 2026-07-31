import React, { FC } from 'react';

import { modelToRef } from '@kubevirt-ui/kubevirt-api/console';
import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import { Title } from '@patternfly/react-core';
import DetailsPageTitle from '@utils/components/DetailsPageTitle/DetailsPageTitle';
import { useLastNamespacePath } from '@utils/hooks/useLastNamespacePath';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import NADActions from '@views/nads/actions/NADActions';

type NADDetailsPageTitleProps = {
  nad: NetworkAttachmentDefinitionKind;
};

const NADDetailsPageTitle: FC<NADDetailsPageTitleProps> = ({ nad }) => {
  const { t } = useNetworkingTranslation();
  const namespacePath = useLastNamespacePath();

  return (
    <DetailsPageTitle
      breadcrumbs={[
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
