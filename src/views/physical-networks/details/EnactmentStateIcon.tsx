import React, { FC } from 'react';

import { RedExclamationCircleIcon } from '@openshift-console/dynamic-plugin-sdk';
import { Icon } from '@patternfly/react-core';
import { CheckIcon, CloseIcon, HourglassHalfIcon, InProgressIcon } from '@patternfly/react-icons';

import { EnactmentState } from '../utils/types';

const ICONS_BY_STATE = {
  [EnactmentState.Aborted]: (
    <Icon status="danger">
      <CloseIcon />
    </Icon>
  ),
  [EnactmentState.Available]: (
    <Icon status="success">
      <CheckIcon />
    </Icon>
  ),
  [EnactmentState.Failing]: <RedExclamationCircleIcon />,
  [EnactmentState.Pending]: <HourglassHalfIcon />,
  [EnactmentState.Progressing]: <InProgressIcon />,
};

type EnactmentStateIconProps = {
  status: string;
};

const EnactmentStateIcon: FC<EnactmentStateIconProps> = ({ status }) => (
  <>
    {ICONS_BY_STATE[status]}
    <span className="pf-v6-u-ml-sm">{status}</span>
  </>
);

export default EnactmentStateIcon;
