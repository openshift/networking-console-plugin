import React, { FC } from 'react';

import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getConfigAsJSON, getType } from '@utils/resources/nads/selectors';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { networkTypes } from '@views/nads/form/utils/types';
import { getLocalnetTopologyType } from '@views/nads/form/utils/utils';

type NADTypeDetailsProps = {
  nad: NetworkAttachmentDefinitionKind;
};

const NADTypeDetails: FC<NADTypeDetailsProps> = ({ nad }) => {
  const { t } = useNetworkingTranslation();
  const nadConfig = getConfigAsJSON(nad);
  const type = getLocalnetTopologyType(getType(nadConfig), nadConfig?.topology);

  if (!type) return <MutedText content={t('Not available')} />;

  return <>{networkTypes?.[type] || type}</>;
};

export default NADTypeDetails;
