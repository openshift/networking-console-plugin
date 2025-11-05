import React, { FC } from 'react';

import { DetailsItemComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getAnnotations } from '@utils/resources/shared';

const NADDescriptionDetails: FC<DetailsItemComponentProps<NetworkAttachmentDefinitionKind>> = ({
  obj: nad,
}) => {
  const { t } = useNetworkingTranslation();

  const description = getAnnotations(nad)?.description;

  if (!description) return <MutedText content={t('No description')} />;

  return <>{description}</>;
};

export default NADDescriptionDetails;
