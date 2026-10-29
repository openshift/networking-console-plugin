import React, { FC } from 'react';
import { useSearchParams } from 'react-router';
import classNames from 'classnames';

import {
  DefaultNode,
  Node,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { ICON_SIZE, TOPOLOGY_SEARCH_QUERY_PARAM } from '@views/topology/utils/constants';
import { isSubsequenceMatch } from '@views/topology/utils/filterModel';

import './CustomNode.scss';

type CustomNodeProps = {
  element: Node;
} & WithDndDropProps &
  WithDragNodeProps &
  WithSelectionProps;

const CustomNode: FC<CustomNodeProps> = ({ element, ...rest }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get(TOPOLOGY_SEARCH_QUERY_PARAM) ?? '').trim();

  // fromModel unparents a filtered-out node before this observer unmounts.
  if (!element.hasParent()) return null;

  const controllerState = element.getController().getState<{
    viewOptions?: { compactView?: boolean; showLabels?: boolean };
  }>();
  const showLabels = controllerState?.viewOptions?.showLabels ?? true;
  // TODO: Read compactView from controllerState.viewOptions.compactView and adjust NODE_DIAMETER when implemented.
  // const _compactView = controllerState?.viewOptions?.compactView ?? true;

  const data = element.getData();
  const Icon = data.icon;
  const { height, width } = element.getBounds();

  const xCenter = (width - ICON_SIZE) / 2;
  const yCenter = (height - ICON_SIZE) / 2;

  const isDerivedFromPolicy = data.isDerivedFromPolicy;
  const isFiltered = isSubsequenceMatch(searchQuery, element.getLabel() ?? '');
  return (
    <DefaultNode
      badge={data?.badge}
      className={classNames('custom-node', { 'is-filtered': isFiltered })}
      element={element}
      showLabel={showLabels}
      showStatusDecorator
      truncateLength={8}
      {...rest}
    >
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
