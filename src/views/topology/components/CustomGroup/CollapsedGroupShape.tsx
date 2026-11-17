import React, { FC } from 'react';

import { Ellipse, ShapeProps } from '@patternfly/react-topology';

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

export default CollapsedGroupShape;
