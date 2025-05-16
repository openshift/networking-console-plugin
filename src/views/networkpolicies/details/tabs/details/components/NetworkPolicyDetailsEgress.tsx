import React from 'react';
import { Trans } from 'react-i18next';

import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { Table, Tbody, Th, Thead, Tr } from '@patternfly/react-table';
import DetailsSectionTitle from '@utils/components/DetailsSectionTitle/DetailsSectionTitle';
import ExternalLink from '@utils/components/ExternalLink/ExternalLink';
import { FLAGS } from '@utils/constants';
import { getNetworkPolicyDocURL, isManaged } from '@utils/constants/documentation';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { consolidatePeers } from '../utils/utils';

import NetworkPolicyDetailsRow from './NetworkPolicyDetailsRow/NetworkPolicyDetailsRow';

const NetworkPolicyDetailsEgress = ({ networkPolicy }) => {
  const { t } = useNetworkingTranslation();
  const hasOpenshiftFlag = useFlag(FLAGS.OPENSHIFT);

  const affectsEgress = networkPolicy?.spec?.policyTypes
    ? networkPolicy.spec.policyTypes.includes('Egress')
    : !!networkPolicy.spec.egress;
  const egressDenied =
    affectsEgress && (!networkPolicy.spec.egress || networkPolicy.spec.egress.length === 0);

  return (
    <>
      <DetailsSectionTitle titleText={t('Egress rules')} />
      <p className="co-m-pane__explanation">
        {t(
          'All outgoing traffic is allowed by default. Egress rules can be used to restrict outgoing traffic if the cluster network provider allows it. When using the OpenShift SDN cluster network provider, egress network policy is not supported.',
        )}
        {!isManaged() && (
          <Trans t={t}>
            {' '}
            See more details in:{' '}
            <ExternalLink
              href={getNetworkPolicyDocURL(hasOpenshiftFlag)}
              text={t('NetworkPolicies documentation')}
            />
            .
          </Trans>
        )}
      </p>
      {egressDenied ? (
        t('All outgoing traffic is denied from Pods in {{namespace}}', {
          namespace: networkPolicy.metadata.namespace,
        })
      ) : (
        <Table gridBreakPoint="">
          <Thead>
            <Tr>
              <Th>{t('From pods')}</Th>
              <Th>{t('To')}</Th>
              <Th>{t('To ports')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(networkPolicy.spec.egress || []).map((rule, i) =>
              consolidatePeers(rule.to).map((row, j) => (
                <NetworkPolicyDetailsRow
                  key={`${i}_${j}`}
                  mainPodSelector={networkPolicy.spec.podSelector}
                  namespace={networkPolicy.metadata.namespace}
                  ports={rule.ports}
                  row={row}
                />
              )),
            )}
          </Tbody>
        </Table>
      )}
    </>
  );
};

export default NetworkPolicyDetailsEgress;
