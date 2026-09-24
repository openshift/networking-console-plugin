import { Controller, Point } from '@patternfly/react-topology';
import { TOPOLOGY_POSITION_LOCAL_STORAGE_KEY } from '@views/topology/utils/constants';

export const saveNodePositions = (visualization: Controller) => {
  const graph = visualization.getGraph();
  const nodePositions = {};

  // Traverse all nodes and their children
  graph.getNodes().forEach((node) => {
    nodePositions[node.getId()] = node.getPosition();
    if (node.isGroup()) {
      node.getAllNodeChildren().forEach((childNode) => {
        nodePositions[childNode.getId()] = childNode.getPosition();
      });
    }
  });

  localStorage.setItem(TOPOLOGY_POSITION_LOCAL_STORAGE_KEY, JSON.stringify(nodePositions));
};

export const restoreNodePositions = (visualization: Controller) => {
  const savedPositions = localStorage.getItem(TOPOLOGY_POSITION_LOCAL_STORAGE_KEY);
  if (savedPositions) {
    const nodePositions = JSON.parse(savedPositions);
    const graph = visualization.getGraph();

    // Traverse all nodes and their children
    graph.getNodes().forEach((node) => {
      if (nodePositions[node.getId()]) {
        node.setPosition(new Point(nodePositions[node.getId()].x, nodePositions[node.getId()].y));
      }

      if (node.isGroup()) {
        node.getAllNodeChildren().forEach((childNode) => {
          if (nodePositions[childNode.getId()]) {
            childNode.setPosition(
              new Point(nodePositions[childNode.getId()].x, nodePositions[childNode.getId()].y),
            );
          }
        });
      }
    });
  }
};
