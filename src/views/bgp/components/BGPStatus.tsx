import React, { FC } from 'react';

import { CamelCaseWrap, Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { Label } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCondition } from '@utils/resources/bgp';

export const BGPStatus: FC<{ condition?: BGPCondition; phase?: string }> = ({
  condition,
  phase,
}) => {
  const { t } = useNetworkingTranslation();
  let color: 'green' | 'orange' | 'red' = 'orange';
  if (phase === 'Ready' && condition?.status === 'True') color = 'green';
  if (phase === 'Degraded' || condition?.status === 'False') color = 'red';
  return <Label color={color}>{phase || t('Unknown')}</Label>;
};

export const Conditions: FC<{ conditions?: BGPCondition[] }> = ({ conditions = [] }) => {
  const { t } = useNetworkingTranslation();
  if (!conditions.length) return <span>{t('No conditions reported')}</span>;

  const statusLabel = (status: string) => {
    if (status === 'True') return t('True');
    if (status === 'False') return t('False');
    return status;
  };

  return (
    <Table gridBreakPoint="">
      <Thead>
        <Tr>
          <Th>{t('Type')}</Th>
          <Th>{t('Status')}</Th>
          <Th visibility={['hidden', 'visibleOnMd']}>{t('Updated')}</Th>
          <Th>{t('Reason')}</Th>
          <Th visibility={['hidden', 'visibleOnSm']}>{t('Message')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {conditions.map((item, index) => (
          <Tr data-test={item.type} key={item.type}>
            <Td data-test={`condition[${index}].type`}>
              <CamelCaseWrap value={item.type} />
            </Td>
            <Td data-test={`condition[${index}].status`}>{statusLabel(item.status)}</Td>
            <Td
              data-test={`condition[${index}].lastTransitionTime`}
              visibility={['hidden', 'visibleOnMd']}
            >
              <Timestamp timestamp={item.lastTransitionTime} />
            </Td>
            <Td data-test={`condition[${index}].reason`}>
              <CamelCaseWrap value={item.reason} />
            </Td>
            <Td data-test={`condition[${index}].message`} visibility={['hidden', 'visibleOnSm']}>
              {item.message?.trim() || '-'}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
