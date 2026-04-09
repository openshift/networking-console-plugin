import React, { FC } from 'react';

import {
  CamelCaseWrap,
  K8sResourceCondition,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { Td, Tr } from '@patternfly/react-table';
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
    <Tr
      data-test={type === ConditionTypes.ClusterServiceVersion ? condition.phase : condition.type}
      key={index}
    >
      {type === ConditionTypes.ClusterServiceVersion ? (
        <Td data-test={`condition[${index}].phase`}>
          <CamelCaseWrap value={condition.phase} />
        </Td>
      ) : (
        <>
          <Td data-test={`condition[${index}].type`}>
            <CamelCaseWrap value={condition.type} />
          </Td>
          <Td data-test={`condition[${index}].status`}>{getStatusLabel(condition.status)}</Td>
        </>
      )}
      <Td
        data-test={`condition[${index}].lastTransitionTime`}
        visibility={['hidden', 'visibleOnMd']}
      >
        <Timestamp timestamp={condition.lastTransitionTime} />
      </Td>
      <Td data-test={`condition[${index}].reason`}>
        <CamelCaseWrap value={condition.reason} />
      </Td>
      {/* remove initial newline which appears in route messages */}
      <Td
        className="co-break-word co-pre-line co-conditions__message"
        data-test={`condition[${index}].message`}
        visibility={['hidden', 'visibleOnSm']}
      >
        <LinkifyExternal>{condition.message?.trim() || '-'}</LinkifyExternal>
      </Td>
    </Tr>
  );
};

export default ConditionRow;
