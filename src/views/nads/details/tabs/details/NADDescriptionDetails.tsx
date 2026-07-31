import React, { FC } from 'react';

import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getAnnotations } from '@utils/resources/shared';

type NADDescriptionDetailsProps = {
  nad: NetworkAttachmentDefinitionKind;
};

const NADDescriptionDetails: FC<NADDescriptionDetailsProps> = ({ nad }) => {
  const { t } = useNetworkingTranslation();

  const description = getAnnotations(nad)?.description;

  if (!description) return <MutedText content={t('No description')} />;

  return <>{description}</>;
};

export default NADDescriptionDetails;
