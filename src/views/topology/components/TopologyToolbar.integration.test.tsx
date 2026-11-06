import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';

import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceType } from '@views/topology/utils/constants';

import { loadListFixture } from '../../../test/fixtures';

/* The toolbar only needs the model shape; the visualization runtime is not part of
 * this flow, and loading it emits a mobx deprecation warning the harness treats as
 * a failure. A module-scope jest.mock has no effect in an ES module, so the mock is
 * registered and the component imported after it. */
jest.unstable_mockModule('@patternfly/react-topology', () => ({
  EdgeStyle: { solid: 'solid' },
  EdgeTerminalType: { directional: 'directional' },
  ModelKind: { graph: 'graph' },
  NodeShape: { ellipse: 'ellipse', octagon: 'octagon', rect: 'rect' },
  NodeStatus: {
    danger: 'danger',
    default: 'default',
    info: 'info',
    success: 'success',
    warning: 'warning',
  },
  Shape: { circle: 'circle', rect: 'rect', rhombus: 'rhombus' },
}));

/* These import the visualization package, so they are loaded after the mock is
 * registered; a static import would evaluate the real module first. */
const { generateDataModel } =
  await import('@views/topology/utils/dataTransformation/dataTransformation');
const { default: TopologyToolbar } = await import('./TopologyToolbar');

const model = generateDataModel({
  clusterUserDefinedNetworks: [],
  networkAttachmentDefinitions: loadListFixture('networkattachmentdefinitions'),
  pods: [],
  projects: [],
  userDefinedNetworks: loadListFixture('userdefinednetworks'),
  virtualMachines: [],
} as never);

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="search">{location.search}</div>;
};

const renderToolbar = () =>
  render(
    <MemoryRouter initialEntries={['/k8s/all-namespaces/networking-topology']}>
      <TopologyToolbar
        displayMode={'graph' as never}
        displayOptions={{} as never}
        layout={'cola' as never}
        model={model}
        onDisplayModeChange={() => undefined}
        onDisplayOptionsChange={() => undefined}
        onLayoutChange={() => undefined}
      />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('TopologyToolbar', () => {
  it('lists the resource types present in the model and filters by the one clicked', async () => {
    renderToolbar();

    await userEvent.click(screen.getByRole('button', { name: 'Filter by...' }));

    // Counts come from the model built out of the recorded networks.
    expect(await screen.findByText(/NetworkAttachmentDefinition \(4\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByText(/UserDefinedNetwork \(2\)/));

    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toContain(
        `resourceTypes=${ResourceType.UserDefinedNetwork}`,
      ),
    );
  });
});
