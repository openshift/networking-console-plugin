import React, { FC, useEffect, useState } from 'react';

import {
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
} from '@patternfly/react-topology';
import ControlBar from '@views/topology/components/TopologyControlBar';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { generateDataModel } from '@views/topology/utils/dataTransformation';
import { componentFactory, layoutFactory } from '@views/topology/utils/factories';

const Topology: FC = ({}) => {
  const [controller, setController] = useState<Visualization>();
  const { resources } = useTopologyContext();

  useEffect(() => {
    const c = new Visualization();
    c.registerLayoutFactory(layoutFactory);
    c.registerComponentFactory(componentFactory);
    setController(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (controller && resources) {
      const model = generateDataModel(resources);
      controller.fromModel(model, false);
      controller.getGraph().layout();
    }
  }, [controller, resources]);

  return (
    <VisualizationProvider controller={controller}>
      <TopologyView controlBar={<ControlBar controller={controller} />}>
        <VisualizationSurface />
      </TopologyView>
    </VisualizationProvider>
  );
};

export default Topology;
