import React, { FC } from 'react';
import { Trans } from 'react-i18next';

import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { Divider, Grid, GridItem } from '@patternfly/react-core';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { FLAGS } from '@utils/constants';
import { getNetworkPolicyDocURL, isManaged } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { consolidatePeers } from '../utils/utils';

import NetworkPolicyDetailsRow from './NetworkPolicyDetailsRow/NetworkPolicyDetailsRow';

type NetworkPolicyDetailsIngressProps = {
  networkPolicy: IoK8sApiNetworkingV1NetworkPolicy;
};

const NetworkPolicyDetailsIngress: FC<NetworkPolicyDetailsIngressProps> = ({ networkPolicy }) => {
  const { t } = useNetworkingTranslation();
  const hasOpenshiftFlag = useFlag(FLAGS.OPENSHIFT);

  const affectsIngress = networkPolicy?.spec?.policyTypes
    ? networkPolicy.spec.policyTypes.includes('Ingress')
    : true;

  if (!affectsIngress) return null;

  const ingressDenied =
    affectsIngress && (!networkPolicy.spec.ingress || isEmpty(networkPolicy.spec.ingress));

  return (
    <>
      <DetailsSectionTitle titleText={t('Ingress rules')} />
      {t(
        'Pods accept all traffic by default. They can be isolated via NetworkPolicies which specify a whitelist of ingress rules. When a Pod is selected by a NetworkPolicy, it will reject all traffic not explicitly allowed via a NetworkPolicy.',
      )}
      {!isManaged() && (
        <Trans t={t}>
          {' '}
          See more details in:{' '}
          <ExternalLink
            href={getNetworkPolicyDocURL(hasOpenshiftFlag)}
            text={t('NetworkPolicies documentation')}
          />
        </Trans>
      )}

      {ingressDenied ? (
        t('All incoming traffic is denied to Pods in {{namespace}}', {
          namespace: networkPolicy.metadata.namespace,
        })
      ) : (
        <>
          <Grid>
            <GridItem span={4}>{t('Target pods')}</GridItem>
            <GridItem span={4}>{t('From')}</GridItem>
            <GridItem span={4}>{t('To ports')}</GridItem>
          </Grid>
          <Divider />
          {(networkPolicy.spec.ingress || []).map((rule, i) =>
            consolidatePeers(rule.from).map((row, j) => (
              <NetworkPolicyDetailsRow
                key={`${i}_${j}`}
                mainPodSelector={networkPolicy?.spec?.podSelector}
                namespace={networkPolicy.metadata.namespace}
                ports={rule.ports}
                row={row}
              />
            )),
          )}
        </>
      )}
    </>
  );
};

export default NetworkPolicyDetailsIngress;
