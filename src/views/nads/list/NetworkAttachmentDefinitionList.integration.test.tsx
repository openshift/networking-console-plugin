import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import NetworkAttachmentDefinitionList from './NetworkAttachmentDefinitionList';

const NAMESPACE = 'cy-test-ns';
const COLLECTION = `*/apis/k8s.cni.cncf.io/v1/namespaces/${NAMESPACE}/network-attachment-definitions`;
// The empty state reads QuickStarts from the console; a real console answers.
const QUICKSTARTS = '*/apis/console.openshift.io/v1/consolequickstarts';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderList = () =>
  render(
    <MemoryRouter
      initialEntries={[`/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition`]}
    >
      <NetworkAttachmentDefinitionList namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

const serveNetworks = (items: unknown[]) =>
  server.use(
    http.get(COLLECTION, () =>
      HttpResponse.json({
        apiVersion: 'k8s.cni.cncf.io/v1',
        items,
        kind: 'NetworkAttachmentDefinitionList',
      }),
    ),
    http.get(QUICKSTARTS, () => HttpResponse.json(loadFixture('consolequickstarts'))),
  );

describe('NetworkAttachmentDefinitionList', () => {
  it('renders the recorded networks, filters them, and opens one', async () => {
    serveNetworks(loadFixture<{ items: unknown[] }>('networkattachmentdefinitions').items);

    renderList();

    await waitFor(() => expect(screen.getByText('network-bridge')).toBeInTheDocument());
    expect(screen.getByText('udn-layer2')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('filter'), 'bridge');

    // The UDN-managed network does not match the search text and drops out.
    await waitFor(() => expect(screen.queryByText('udn-layer2')).not.toBeInTheDocument());
    expect(screen.getByText('network-bridge')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'network-bridge' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/network-bridge`,
      ),
    );
  });

  it('navigates to the create form from the header button', async () => {
    serveNetworks(loadFixture<{ items: unknown[] }>('networkattachmentdefinitions').items);

    renderList();

    await waitFor(() => expect(screen.getByText('network-bridge')).toBeInTheDocument());
    await userEvent.click(
      screen.getByRole('button', { name: 'Create NetworkAttachmentDefinition' }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/~new/form`,
      ),
    );
  });

  it('shows the empty state, with the create action, when no network exists', async () => {
    serveNetworks([]);

    renderList();

    // Both the page header and the empty state offer the create action.
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: 'Create NetworkAttachmentDefinition' }).length,
      ).toBeGreaterThan(0),
    );
    expect(screen.queryByTestId('resource-link-network-bridge')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Create NetworkAttachmentDefinition' })[0],
    );
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/~new/form`,
      ),
    );
  });

  it('opens the actions for a plain network and for a managed one', async () => {
    serveNetworks(loadFixture<{ items: unknown[] }>('networkattachmentdefinitions').items);

    renderList();

    await waitFor(() => expect(screen.getByText('network-bridge')).toBeInTheDocument());

    const bridgeRow = screen.getByText('network-bridge').closest('tr');
    await userEvent.click(within(bridgeRow).getByRole('button'));
    expect(document.querySelector('[data-ouia-component-id="edit-nad"]')).not.toHaveClass(
      'pf-m-disabled',
    );
    expect(document.querySelector('[data-ouia-component-id="delete-nad"]')).not.toHaveClass(
      'pf-m-disabled',
    );

    // Close the first menu before opening the next row's, so the query below
    // cannot read the still-mounted plain-network items.
    await userEvent.click(within(bridgeRow).getByRole('button'));

    const managedRow = screen.getByText('udn-layer2').closest('tr');
    await userEvent.click(within(managedRow).getByRole('button'));
    expect(document.querySelector('[data-ouia-component-id="edit-nad"]')).toHaveClass(
      'pf-m-disabled',
    );
    expect(document.querySelector('[data-ouia-component-id="delete-nad"]')).toHaveClass(
      'pf-m-disabled',
    );
    expect(screen.getAllByText('Managed by UserDefinedNetwork').length).toBeGreaterThan(0);
  });
});
