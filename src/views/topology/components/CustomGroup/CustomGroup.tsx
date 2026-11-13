import React, { FC } from 'react';

import {
  DefaultGroup,
  Node,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { NODE_DIAMETER } from '@views/topology/utils/constants';

import CollapsedGroupShape from './CollapsedGroupShape';

import './CustomGroup.scss';

type CustomGroupProps = {
  element: Node;
} & WithDndDropProps &
  WithDragNodeProps &
  WithSelectionProps;

const CustomGroup: FC<CustomGroupProps> = ({ element, ...rest }) => {
  const data = element.getData();

  return (
    <DefaultGroup
      badge={data?.badge}
      className="custom-group"
      collapsedHeight={NODE_DIAMETER}
      collapsedWidth={NODE_DIAMETER}
      collapsible
      element={element}
      getCollapsedShape={() => CollapsedGroupShape}
      {...rest}
    />
  );
};

export default CustomGroup;
