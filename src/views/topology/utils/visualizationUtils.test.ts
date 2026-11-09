import { describe, expect, it, jest } from '@jest/globals';
import { Model, Visualization } from '@patternfly/react-topology';

import { clearRemovedSelection, elementIds } from './visualizationUtils';

jest.mock('@patternfly/react-topology', () => ({
  SELECTION_EVENT: 'selection-change',
}));

const model = {
  edges: [{ id: 'nad-1-pod-1', source: 'nad-1', target: 'pod-1', type: 'edge' }],
  graph: { id: 'graph' },
  nodes: [
    { data: {}, id: 'nad-1', label: 'nad-a', type: 'node' },
    { data: {}, id: 'pod-1', label: 'pod-a', type: 'node' },
  ],
  type: 'graph',
} as unknown as Model;

describe('visualizationUtils', () => {
  it('collects graph, node and edge ids', () => {
    expect(elementIds(model)).toEqual(new Set(['graph', 'nad-1', 'nad-1-pod-1', 'pod-1']));
  });

  it('drops selected ids that are no longer in the model and notifies the controller', () => {
    const controller = {
      fireEvent: jest.fn(),
      getState: jest.fn().mockReturnValue({ selectedIds: ['nad-1', 'pod-1'] }),
      setState: jest.fn(),
    };

    clearRemovedSelection(
      controller as unknown as Visualization,
      {
        ...model,
        nodes: [{ data: {}, id: 'nad-1', label: 'nad-a', type: 'node' }],
      } as Model,
    );

    expect(controller.setState).toHaveBeenCalledWith({ selectedIds: ['nad-1'] });
    expect(controller.fireEvent).toHaveBeenCalledWith('selection-change', ['nad-1']);
  });

  it('leaves the selection untouched when every selected id is still present', () => {
    const controller = {
      fireEvent: jest.fn(),
      getState: jest.fn().mockReturnValue({ selectedIds: ['nad-1'] }),
      setState: jest.fn(),
    };

    clearRemovedSelection(controller as unknown as Visualization, model);

    expect(controller.setState).not.toHaveBeenCalled();
    expect(controller.fireEvent).not.toHaveBeenCalled();

    const emptyController = {
      fireEvent: jest.fn(),
      getState: jest.fn().mockReturnValue({}),
      setState: jest.fn(),
    };

    clearRemovedSelection(emptyController as unknown as Visualization, model);

    expect(emptyController.setState).not.toHaveBeenCalled();
    expect(emptyController.fireEvent).not.toHaveBeenCalled();
  });
});
