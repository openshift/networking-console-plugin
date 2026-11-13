import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import ServiceList from './ServiceList';

const NAMESPACE = 'cy-test-ns';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderList = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/core~v1~Service`]}>
      <ServiceList kind="Service" namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

const serveServices = (
  services: unknown = loadFixture('services'),
  slices: unknown = loadFixture('endpointslices'),
) =>
  server.use(
    http.get(`*/api/v1/namespaces/${NAMESPACE}/services`, () => HttpResponse.json(services)),
    http.get(`*/apis/discovery.k8s.io/v1/namespaces/${NAMESPACE}/endpointslices`, () =>
      HttpResponse.json(slices),
    ),
  );

describe('ServiceList', () => {
  it('renders each service with the health of its endpoints', async () => {
    serveServices();

    renderList();

    await waitFor(() => expect(screen.getByText('web')).toBeInTheDocument());
    // Endpoint health arrives on its own request, so it can lag the service row.
    await waitFor(() => {
      // The capture holds one service whose two endpoints are both ready.
      expect(screen.getAllByText('2/2').length).toBeGreaterThanOrEqual(1);
    });

    await userEvent.type(screen.getByLabelText('filter'), 'web');
    expect(screen.getByText('web')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'web' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/core~v1~Service/web`,
      ),
    );
  });

  it('shows Healthy, Degraded, Down and Unknown from the endpoint data', async () => {
    serveServices();

    renderList();

    await waitFor(() => expect(screen.getByText('healthy')).toBeInTheDocument());
    // Same lag: each health label is derived from the endpoint slice response.
    await waitFor(() => {
      expect(
        screen.getAllByLabelText('Healthy: 2 of 2 endpoints ready').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByLabelText('Degraded: 1 of 2 endpoints ready').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByLabelText('Down: 0 of 2 endpoints ready').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByLabelText('Unknown: endpoint readiness not available').length,
      ).toBeGreaterThanOrEqual(1);
    });

    await userEvent.type(screen.getByLabelText('filter'), 'degraded');
    await waitFor(() => expect(screen.queryByText('healthy')).not.toBeInTheDocument());
    expect(screen.getByText('degraded')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'degraded' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/core~v1~Service/degraded`,
      ),
    );
  });

  it('renders each service location variant', async () => {
    serveServices();

    renderList();

    const [clusterIP, loadBalancer, nodePort] = ['cluster-ip', 'load-balancer', 'node-port'].map(
      (name) =>
        loadFixture<{
          items: Array<{
            metadata: { name: string };
            spec: Record<string, unknown>;
            status?: Record<string, unknown>;
          }>;
        }>('services').items.find((item) => item.metadata.name === name),
    );
    const loadBalancerLocation =
      (loadBalancer.status?.loadBalancer as { ingress?: Array<{ hostname?: string; ip?: string }> })
        ?.ingress?.[0]?.hostname ||
      (loadBalancer.status?.loadBalancer as { ingress?: Array<{ hostname?: string; ip?: string }> })
        ?.ingress?.[0]?.ip ||
      'Pending';

    await waitFor(() => expect(screen.getByText('cluster-ip')).toBeInTheDocument());
    expect(
      screen.getAllByText(`${clusterIP.spec.clusterIP}:${clusterIP.spec.ports[0].port}`).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(
      screen.getAllByText(`${nodePort.spec.clusterIP}:${nodePort.spec.ports[0].nodePort}`).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(loadBalancerLocation).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('example.com:80').length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByLabelText('filter'), 'headless');
    await waitFor(() => expect(screen.queryByText('cluster-ip')).not.toBeInTheDocument());
    expect(screen.getByText('None')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'headless' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/core~v1~Service/headless`,
      ),
    );
  });

  it('filters the list and opens a service', async () => {
    serveServices();

    renderList();

    await waitFor(() => expect(screen.getByText('web')).toBeInTheDocument());
    await userEvent.type(screen.getByLabelText('filter'), 'no-such-service');

    await waitFor(() => expect(screen.queryByText('web')).not.toBeInTheDocument());

    await userEvent.clear(screen.getByLabelText('filter'));
    await waitFor(() => expect(screen.getByText('web')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('link', { name: 'web' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/core~v1~Service/web`,
      ),
    );
  });

  it('navigates to the create form from the header button', async () => {
    serveServices();

    renderList();

    await waitFor(() => expect(screen.getByText('web')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Create Service' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/core~v1~Service/~new/form`,
      ),
    );
  });
});
