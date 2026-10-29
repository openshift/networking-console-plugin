import { Model, SELECTION_EVENT, Visualization } from '@patternfly/react-topology';

export const elementIds = (model: Model): Set<string> => {
  const ids = new Set<string>();
  if (model.graph?.id) {
    ids.add(model.graph.id);
  }
  model.nodes?.forEach((node) => ids.add(node.id));
  model.edges?.forEach((edge) => {
    if (edge.id) {
      ids.add(edge.id);
    }
  });
  return ids;
};

export const clearRemovedSelection = (controller: Visualization, model: Model) => {
  const selectedIds = controller.getState<{ selectedIds?: string[] }>().selectedIds ?? [];
  if (selectedIds.length === 0) return;

  const presentIds = elementIds(model);
  const remaining = selectedIds.filter((id) => presentIds.has(id));
  if (remaining.length === selectedIds.length) return;

  controller.setState({ selectedIds: remaining });
  controller.fireEvent(SELECTION_EVENT, remaining);
};
