import {
  BreadthFirstLayout,
  ColaLayout,
  ComponentFactory,
  ConcentricLayout,
  DagreLayout,
  DefaultEdge,
  ForceLayout,
  Graph,
  GraphComponent,
  GridLayout,
  ModelKind,
  nodeDragSourceSpec,
  withDragNode,
  withPanZoom,
  withSelection,
} from '@patternfly/react-topology';
import { GROUP, TopologyLayoutType } from '@views/topology/utils/constants';
import { LevelsLayout } from '@views/topology/utils/LevelsLayout';

import CustomGroup from '../components/CustomGroup/CustomGroup';
import CustomNode from '../components/CustomNode/CustomNode';

export const layoutFactory = (type: string, graph: Graph) => {
  switch (type) {
    case TopologyLayoutType.BreadthFirst:
      return new BreadthFirstLayout(graph);
    case TopologyLayoutType.Cola:
      return new ColaLayout(graph, { layoutOnDrag: false, maxTicks: 10 });
    case TopologyLayoutType.Concentric:
      return new ConcentricLayout(graph);
    case TopologyLayoutType.Dagre:
      return new DagreLayout(graph, { rankdir: 'LR' });
    case TopologyLayoutType.Force:
      return new ForceLayout(graph, { layoutOnDrag: false });
    case TopologyLayoutType.Grid:
      return new GridLayout(graph);
    case TopologyLayoutType.Levels:
      return new LevelsLayout(graph, { layoutOnDrag: true });
    default:
      return new DagreLayout(graph, { rankdir: 'LR' });
  }
};

export const componentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
  switch (type) {
    case GROUP:
      return withDragNode(nodeDragSourceSpec(GROUP))(withSelection()(CustomGroup));
    default:
      switch (kind) {
        case ModelKind.graph:
          return withPanZoom()(GraphComponent);
        case ModelKind.node:
          return withDragNode(nodeDragSourceSpec(ModelKind.node, true, true))(
            withSelection()(CustomNode),
          );
        case ModelKind.edge:
          return DefaultEdge;
        default:
          return undefined;
      }
  }
};
