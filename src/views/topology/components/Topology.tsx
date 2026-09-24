import React, { FC, useEffect, useState } from 'react';

import {
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
} from '@patternfly/react-topology';
import { isEmpty } from '@utils/utils';
import ControlBar from '@views/topology/components/TopologyControlBar';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { GRAPH_POSITIONING_EVENT, NODE_POSITIONING_EVENT } from '@views/topology/utils/constants';
import { generateDataModel } from '@views/topology/utils/dataTransformation/dataTransformation';
import { componentFactory, layoutFactory } from '@views/topology/utils/factories';
import { restoreNodePositions, saveNodePositions } from '@views/topology/utils/nodePositionUtils';

const Topology: FC = () => {
  const [controller, setController] = useState<Visualization>();
  const { resources } = useTopologyContext();

  useEffect(() => {
    if (!resources || isEmpty(resources)) return;
    const topologyModel = generateDataModel(resources);

    if (!controller) {
      const newController = new Visualization();
      newController.registerLayoutFactory(layoutFactory);
      newController.registerComponentFactory(componentFactory);

      newController.addEventListener(NODE_POSITIONING_EVENT, () =>
        saveNodePositions(newController),
      );
      newController.addEventListener(GRAPH_POSITIONING_EVENT, () =>
        saveNodePositions(newController),
      );

      newController.setFitToScreenOnLayout(true);
      newController.fromModel(topologyModel, false);
      restoreNodePositions(newController);

      newController.setFitToScreenOnLayout(true);
      setController(newController);
      return;
    }

    controller.fromModel(topologyModel);
  }, [controller, resources]);

  // Re-run fit after mount to ensure correct scale when container size stabilizes (e.g. navigation from create flow)
  useEffect(() => {
    if (!controller) return;

    const id = requestAnimationFrame(() => {
      controller.getGraph().fit(40);
    });

    return () => cancelAnimationFrame(id);
  }, [controller]);

  return (
    <VisualizationProvider controller={controller}>
      <TopologyView controlBar={<ControlBar controller={controller} />}>
        <VisualizationSurface />
      </TopologyView>
    </VisualizationProvider>
  );
};

export default Topology;
