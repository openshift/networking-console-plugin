import React, { FC } from 'react';
import * as _ from 'lodash';

import { K8sResourceCondition } from '@openshift-console/dynamic-plugin-sdk';
import { Table, Tbody, Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import ConditionRow from '@views/routes/details/components/tabs/detailsTab/components/RouteIngressStatusSection/ConditionRow';
import { ClusterServiceVersionCondition, ConditionTypes } from '@views/routes/details/utils/types';

export type ConditionsProps = {
  conditions: ClusterServiceVersionCondition[] | K8sResourceCondition[];
  type?: keyof typeof ConditionTypes;
};

const Conditions: FC<ConditionsProps> = ({ conditions, type = ConditionTypes.K8sResource }) => {
  const { t } = useNetworkingTranslation();

  const rows = (conditions as Array<ClusterServiceVersionCondition | K8sResourceCondition>)?.map?.(
    (condition: ClusterServiceVersionCondition & K8sResourceCondition, i: number) => (
      <ConditionRow condition={condition} index={i} key={`condition-${i}`} type={type} />
    ),
  );

  if (_.isEmpty(conditions)) {
    return (
      <div className="cos-status-box">
        <div className="pf-v6-u-text-align-center">{t('No conditions found')}</div>
      </div>
    );
  }

  return (
    <Table gridBreakPoint="">
      <Thead>
        <Tr>
          {type === ConditionTypes.ClusterServiceVersion ? (
            <Th>{t('Phase')}</Th>
          ) : (
            <>
              <Th>{t('Type')}</Th>
              <Th>{t('Status')}</Th>
            </>
          )}
          <Th visibility={['hidden', 'visibleOnMd']}>{t('Updated')}</Th>
          <Th>{t('Reason')}</Th>
          <Th visibility={['hidden', 'visibleOnSm']}>{t('Message')}</Th>
        </Tr>
      </Thead>
      <Tbody>{rows}</Tbody>
    </Table>
  );
};

export default Conditions;
