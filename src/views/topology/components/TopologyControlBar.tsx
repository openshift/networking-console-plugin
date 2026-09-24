import React, { FC } from 'react';

import {
  action,
  Controller,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar,
} from '@patternfly/react-topology';

type ControlBarProps = {
  controller: Controller;
};

const ControlBar: FC<ControlBarProps> = ({ controller }) => {
  if (!controller) {
    return null;
  }
  return (
    <TopologyControlBar
      controlButtons={createTopologyControlButtons({
        ...defaultControlButtonsOptions,
        fitToScreenCallback: action(() => {
          controller.getGraph().fit(40);
        }),
        resetViewCallback: action(() => {
          controller.getGraph().reset();
          controller.getGraph().layout();
        }),
        zoomInCallback: action(() => {
          const scale = controller.getGraph().getScale();
          controller.getGraph().setScale(scale * 1.1);
        }),
        zoomOutCallback: action(() => {
          const scale = controller.getGraph().getScale();
          controller.getGraph().setScale(scale * 0.9);
        }),
      })}
    />
  );
};

export default ControlBar;
