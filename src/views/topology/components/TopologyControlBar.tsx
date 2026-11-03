import React, { FC, useMemo, useState } from 'react';

import { Popover, PopoverPosition } from '@patternfly/react-core';
import {
  action,
  Controller,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  Model,
  TopologyControlBar,
} from '@patternfly/react-topology';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import TopologyLegend from '@views/topology/components/TopologyLegend';

type ControlBarProps = {
  controller: Controller;
  model?: Model;
};

const ControlBar: FC<ControlBarProps> = ({ controller, model }) => {
  const { t } = useNetworkingTranslation();
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const legendBody = useMemo(() => <TopologyLegend model={model} />, [model]);

  if (!controller) {
    return null;
  }
  return (
    <div className="networking-topology__control-bar">
      <TopologyControlBar
        controlButtons={createTopologyControlButtons({
          ...defaultControlButtonsOptions,
          fitToScreenCallback: action(() => {
            controller.getGraph().fit(40);
          }),
          legendAriaLabel: t('Show topology legend'),
          legendCallback: action(() => setIsLegendOpen((open) => !open)),
          legendTip: t('Legend'),
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
      <Popover
        bodyContent={legendBody}
        className="networking-topology__legend-popover"
        headerContent={t('Legend')}
        isVisible={isLegendOpen}
        position={PopoverPosition.right}
        shouldClose={(_event, hideFunction) => {
          hideFunction?.();
          setIsLegendOpen(false);
        }}
        showClose
        triggerRef={() => document.getElementById('legend') as HTMLElement}
      />
    </div>
  );
};

export default ControlBar;
