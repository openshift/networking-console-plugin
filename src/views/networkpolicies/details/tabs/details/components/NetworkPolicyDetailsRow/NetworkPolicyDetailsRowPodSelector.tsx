import React from 'react';
import { Link } from 'react-router';

import MutedText from '@utils/components/MutedText/MutedText';
import { Selector } from '@utils/components/Selector/Selector';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

const NetworkPolicyDetailsRowPodSelector = ({ mainPodSelector, namespace }) => {
  const { t } = useNetworkingTranslation();

  return (
    <>
      <MutedText content={t('Pod selector')} />
      {isEmpty(mainPodSelector) ? (
        <Link to={`/search/ns/${namespace}?kind=Pod`}>{`All pods within ${namespace}`}</Link>
      ) : (
        <Selector namespace={namespace} selector={mainPodSelector} />
      )}
    </>
  );
};

export default NetworkPolicyDetailsRowPodSelector;
