import React, { FC } from 'react';

import {
  DefaultGroup,
  Node,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';

import './CustomGroup.scss';

type CustomGroupProps = {
  element: Node;
} & WithDndDropProps &
  WithDragNodeProps &
  WithSelectionProps;

const CustomGroup: FC<CustomGroupProps> = ({ element, ...rest }) => {
  const data = element.getData();

  return <DefaultGroup badge={data?.badge} className="custom-group" element={element} {...rest} />;
};

export default CustomGroup;
