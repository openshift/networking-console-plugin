import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../test/fixtures';
import { server } from '../../test/msw';

import PhysicalNetworksPage from './PhysicalNetworksPage';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/k8s/all-namespaces/physical-networks']}>
      <PhysicalNetworksPage />
      <LocationProbe />
    </MemoryRouter>,
  );

const serveSources = () => {
  server.use(
    http.get('*/apis/k8s.cni.cncf.io/v1/network-attachment-definitions', () =>
      HttpResponse.json(loadFixture('networkattachmentdefinitions')),
    ),
    http.get('*/api/v1/pods', () => HttpResponse.json(loadFixture('pods'))),
    http.get('*/apis/nmstate.io/v1/nodenetworkconfigurationpolicies', () =>
      HttpResponse.json(loadFixture('nodenetworkconfigurationpolicies')),
    ),
    http.get('*/apis/nmstate.io/v1beta1/nodenetworkconfigurationenactments', () =>
      HttpResponse.json(loadFixture('nodenetworkconfigurationenactments')),
    ),
    http.get('*/apis/nmstate.io/v1beta1/nodenetworkstates', () =>
      HttpResponse.json(loadFixture('nodenetworkstates')),
    ),
    http.get('*/api/v1/nodes', () => HttpResponse.json(loadFixture('nodes'))),
    /* The scope selector lists projects through useProjects. A cluster-wide
     * ProjectList cannot be recorded without capturing every namespace on the
     * cluster, so answer with the single project the suite owns. */
    http.get('*/apis/project.openshift.io/v1/projects', () =>
      HttpResponse.json({
        apiVersion: 'project.openshift.io/v1',
        items: [
          {
            apiVersion: 'project.openshift.io/v1',
            kind: 'Project',
            metadata: { name: 'cy-test-ns' },
          },
        ],
        kind: 'ProjectList',
      }),
    ),
  );
};

describe('PhysicalNetworksPage', () => {
  it('filters physical networks and expands one to show its mappings', async () => {
    serveSources();

    renderPage();

    await waitFor(() => expect(screen.getByText('physnet')).toBeInTheDocument());
    expect(screen.getByText('net134137')).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText('Filter physical networks search input'),
      'net134137',
    );

    await waitFor(() => expect(screen.queryByText('physnet')).not.toBeInTheDocument());
    expect(screen.getByText('net134137')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Filter physical networks search input'));
    await waitFor(() => expect(screen.getByText('physnet')).toBeInTheDocument());

    const physnetRow = screen.getByText('physnet').closest('tr');
    await userEvent.click(within(physnetRow).getByRole('button', { name: 'Details' }));

    expect(screen.getAllByLabelText('Observed mappings table').length).toBeGreaterThan(0);
    expect(await screen.findAllByRole('link', { name: 'node-1' })).toHaveLength(1);
  });

  it('opens a node from an expanded mapping', async () => {
    serveSources();

    renderPage();

    await waitFor(() => expect(screen.getByText('physnet')).toBeInTheDocument());
    const physnetRow = screen.getByText('physnet').closest('tr');
    await userEvent.click(within(physnetRow).getByRole('button', { name: 'Details' }));

    const nodeLinks = await screen.findAllByRole('link', { name: 'node-1' });
    await userEvent.click(nodeLinks[0]);

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/k8s/cluster/nodes/node-1'),
    );
  });
});
