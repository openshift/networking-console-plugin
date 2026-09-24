import React, { FC } from 'react';

import {
  DefaultNode,
  Node,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { ICON_SIZE } from '@views/topology/utils/constants';

import './CustomNode.scss';

type CustomNodeProps = {
  element: Node;
} & WithDndDropProps &
  WithDragNodeProps &
  WithSelectionProps;

const CustomNode: FC<CustomNodeProps> = ({ element, ...rest }) => {
  const data = element.getData();
  const Icon = data.icon;
  const { height, width } = element.getBounds();

  const xCenter = (width - ICON_SIZE) / 2;
  const yCenter = (height - ICON_SIZE) / 2;

  const isDerivedFromPolicy = data.isDerivedFromPolicy;
  return (
    <DefaultNode className="custom-node" element={element} truncateLength={8} {...rest}>
      <g transform={`translate(${xCenter}, ${yCenter})`}>
        <Icon height={ICON_SIZE} width={ICON_SIZE} />
      </g>
      {isDerivedFromPolicy && (
        <rect
          className="custom-node__inner-border"
          fill="none"
          height={height - 16}
          rx="50%"
          ry="50%"
          stroke="#007BFF"
          strokeWidth={2}
          width={width - 16}
          x={8}
          y={8}
        />
      )}
    </DefaultNode>
  );
};

export default CustomNode;
