import React, { FC } from 'react';

import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getAnnotations } from '@utils/resources/shared';

type DescriptionDetailsProps = {
  obj: K8sResourceCommon;
};

const DescriptionDetails: FC<DescriptionDetailsProps> = ({ obj }) => {
  const { t } = useNetworkingTranslation();

  const description = getAnnotations(obj)?.description;

  return description ? <>{description}</> : <MutedText content={t('No description')} />;
};

export default DescriptionDetails;
