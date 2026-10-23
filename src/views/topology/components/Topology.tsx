import React, { FC, useCallback, useEffect, useState } from 'react';

import {
  SelectionEventListener,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
} from '@patternfly/react-topology';
import { isEmpty } from '@utils/utils';
import ControlBar from '@views/topology/components/TopologyControlBar';
import TopologyDrawer from '@views/topology/components/TopologyDrawer/TopologyDrawer';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { GRAPH_POSITIONING_EVENT, NODE_POSITIONING_EVENT } from '@views/topology/utils/constants';
import { generateDataModel } from '@views/topology/utils/dataTransformation/dataTransformation';
import { componentFactory, layoutFactory } from '@views/topology/utils/factories';
import { restoreNodePositions, saveNodePositions } from '@views/topology/utils/nodePositionUtils';

const Topology: FC = () => {
  const [controller, setController] = useState<Visualization>();
  const { onSelectNode, resources } = useTopologyContext();

  const handleSelection: SelectionEventListener = useCallback(
    (selectedIds: string[]) => {
      if (!controller) return;

      if (selectedIds.length === 0) {
        onSelectNode(null);
        return;
      }

      const selectedId = selectedIds[0];
      const node = controller.getElementById(selectedId);

      if (node && node.getType() === 'node') {
        onSelectNode(node);
      }
    },
    [controller, onSelectNode],
  );

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

  useEffect(() => {
    if (!controller) return;

    controller.addEventListener<SelectionEventListener>('selection', handleSelection);

    return () => {
      controller.removeEventListener('selection', handleSelection);
    };
  }, [controller, handleSelection]);

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
      <TopologyDrawer>
        <TopologyView controlBar={<ControlBar controller={controller} />}>
          <VisualizationSurface />
        </TopologyView>
      </TopologyDrawer>
    </VisualizationProvider>
  );
};

export default Topology;
