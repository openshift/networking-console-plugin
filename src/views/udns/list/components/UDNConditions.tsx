import React, { FC, memo } from 'react';

import { LabelGroup } from '@patternfly/react-core';
import { UDNCondition } from '@utils/resources/udns/types';

import UDNConditionLabel from './UDNConditionLabel';

type UDNConditionsProps = {
  conditions: UDNCondition[];
};

const UDNConditions: FC<UDNConditionsProps> = memo(({ conditions }) => (
  <LabelGroup>
    {conditions?.map((condition) => (
      <UDNConditionLabel condition={condition} key={condition.type} />
    ))}
  </LabelGroup>
));
UDNConditions.displayName = 'UDNConditions';

export default UDNConditions;
