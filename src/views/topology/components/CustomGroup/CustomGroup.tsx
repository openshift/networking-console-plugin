import React, { FC } from 'react';

import {
  DefaultGroup,
  Ellipse,
  Node,
  ShapeProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { NODE_DIAMETER } from '@views/topology/utils/constants';

import './CustomGroup.scss';

type CustomGroupProps = {
  element: Node;
} & WithDndDropProps &
  WithDragNodeProps &
  WithSelectionProps;

const CollapsedGroupShape: FC<ShapeProps> = ({
  className,
  dndDropRef,
  element,
  filter,
  height,
  width,
}) => {
  const Icon = element.getData()?.icon;
  const iconSize = Math.min(width, height) * 0.45;

  return (
    <g>
      <Ellipse
        className={className}
        dndDropRef={dndDropRef}
        element={element}
        filter={filter}
        height={height}
        width={width}
      />
      {Icon && (
        <g
          pointerEvents="none"
          transform={`translate(${(width - iconSize) / 2}, ${(height - iconSize) / 2})`}
        >
          <Icon height={iconSize} width={iconSize} />
        </g>
      )}
    </g>
  );
};

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
