import React, { FC, useState } from 'react';

import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { FLAGS } from '@utils/constants';
import { getNetworkPolicyDocURL, isManaged } from '@utils/constants/documentation';
import { ClusterNetworkFeatures } from '@utils/hooks/useClusterNetworkFeatures';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type NetworkPolicyFormSDNAlertProps = {
  networkFeatures: ClusterNetworkFeatures;
  networkFeaturesLoaded: boolean;
};

const NetworkPolicyFormSDNAlert: FC<NetworkPolicyFormSDNAlertProps> = ({
  networkFeatures,
  networkFeaturesLoaded,
}) => {
  const { t } = useNetworkingTranslation();
  const [showSDNAlert, setShowSDNAlert] = useState(true);
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);

  if (
    !showSDNAlert ||
    !networkFeaturesLoaded ||
    networkFeatures?.PolicyEgress !== undefined ||
    networkFeatures?.PolicyPeerIPBlockExceptions !== undefined
  )
    return null;

  return (
    <Alert
      actionClose={<AlertActionCloseButton onClose={() => setShowSDNAlert(false)} />}
      title={t('When using the OpenShift SDN cluster network provider:')}
      variant={AlertVariant.info}
    >
      <ul>
        <li>{t('Egress network policy is not supported.')}</li>
        <li>
          {t(
            'IP block exceptions are not supported and would cause the entire IP block section to be ignored.',
          )}
        </li>
      </ul>
      <p>{t('Refer to your cluster administrator to know which network provider is used.')}</p>
      {!isManaged() && (
        <p>
          {t('More information:')}&nbsp;
          <ExternalLink
            href={getNetworkPolicyDocURL(isOpenShift)}
            text={t('NetworkPolicies documentation')}
          />
        </p>
      )}
    </Alert>
  );
};

export default NetworkPolicyFormSDNAlert;
