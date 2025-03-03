import React, { FC } from 'react';
import * as _ from 'lodash';

import { K8sResourceCondition } from '@openshift-console/dynamic-plugin-sdk';
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
    (condition: K8sResourceCondition & ClusterServiceVersionCondition, i: number) => (
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
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        {type === ConditionTypes.ClusterServiceVersion ? (
          <div className="col-xs-4 col-sm-2 col-md-2">{t('Phase')}</div>
        ) : (
          <>
            <div className="col-xs-4 col-sm-2 col-md-2">{t('Type')}</div>
            <div className="col-xs-4 col-sm-2 col-md-2">{t('Status')}</div>
          </>
        )}
        <div className="hidden-xs hidden-sm col-md-2">{t('Updated')}</div>
        <div className="col-xs-4 col-sm-3 col-md-2">{t('Reason')}</div>
        <div className="hidden-xs col-sm-5 col-md-4">{t('Message')}</div>
      </div>
      <div className="co-m-table-grid__body">{rows}</div>
    </div>
  );
};

export default Conditions;
