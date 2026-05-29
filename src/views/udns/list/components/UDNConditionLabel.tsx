import React, { FC, memo } from 'react';

import { Label, Popover, PopoverPosition } from '@patternfly/react-core';
import { UDNCondition } from '@utils/resources/udns/types';

type UDNConditionLabelProps = {
  condition: UDNCondition;
};

const UDNConditionLabel: FC<UDNConditionLabelProps> = memo(({ condition }) => {
  const bodyContent = condition?.message || condition?.reason;

  const InnerLabel = (
    <Label onClick={bodyContent ? (e) => e.preventDefault() : undefined}>
      {condition?.type}={condition?.status}
    </Label>
  );

  if (!bodyContent) {
    return InnerLabel;
  }

  return (
    <Popover
      aria-label="Condition Popover"
      bodyContent={() => <div>{bodyContent}</div>}
      position={PopoverPosition.top}
    >
      {InnerLabel}
    </Popover>
  );
});
UDNConditionLabel.displayName = 'UDNConditionLabel';

export default UDNConditionLabel;
