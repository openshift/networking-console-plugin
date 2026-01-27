import React, { FC } from 'react';

import {
  CamelCaseWrap,
  K8sResourceCondition,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import LinkifyExternal from '@views/routes/details/components/tabs/detailsTab/components/RouteIngressStatusSection/LinkifyExternal';
import { ClusterServiceVersionCondition, ConditionTypes } from '@views/routes/details/utils/types';
import { getStatusLabel } from '@views/routes/details/utils/utils';

type ConditionRowProps = {
  condition: ClusterServiceVersionCondition & K8sResourceCondition;
  index: number;
  type: keyof typeof ConditionTypes;
};

const ConditionRow: FC<ConditionRowProps> = ({ condition, index, type }) => {
  return (
    <div
      className="row"
      data-test={type === ConditionTypes.ClusterServiceVersion ? condition.phase : condition.type}
      key={index}
    >
      {type === ConditionTypes.ClusterServiceVersion ? (
        <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${index}].phase`}>
          <CamelCaseWrap value={condition.phase} />
        </div>
      ) : (
        <>
          <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${index}].type`}>
            <CamelCaseWrap value={condition.type} />
          </div>
          <div className="col-xs-4 col-sm-2 col-md-2" data-test={`condition[${index}].status`}>
            {getStatusLabel(condition.status)}
          </div>
        </>
      )}
      <div
        className="hidden-xs hidden-sm col-md-2"
        data-test={`condition[${index}].lastTransitionTime`}
      >
        <Timestamp timestamp={condition.lastTransitionTime} />
      </div>
      <div className="col-xs-4 col-sm-3 col-md-2" data-test={`condition[${index}].reason`}>
        <CamelCaseWrap value={condition.reason} />
      </div>
      {/* remove initial newline which appears in route messages */}
      <div
        className="hidden-xs col-sm-5 col-md-4 co-break-word co-pre-line co-conditions__message"
        data-test={`condition[${index}].message`}
      >
        <LinkifyExternal>{condition.message?.trim() || '-'}</LinkifyExternal>
      </div>
    </div>
  );
};

export default ConditionRow;
