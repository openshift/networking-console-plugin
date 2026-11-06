import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import RoutesList from './RoutesList';

const NAMESPACE = 'cy-test-ns';

const ROUTES = loadFixture('routes');

const serveRoutes = () =>
  server.use(
    http.get(`*/apis/route.openshift.io/v1/namespaces/${NAMESPACE}/routes`, () =>
      HttpResponse.json(ROUTES),
    ),
    http.get(`*/api/v1/namespaces/${NAMESPACE}/services`, () =>
      HttpResponse.json(loadFixture('services')),
    ),
    http.get(`*/apis/discovery.k8s.io/v1/namespaces/${NAMESPACE}/endpointslices`, () =>
      HttpResponse.json(loadFixture('endpointslices')),
    ),
  );

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderList = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/route.openshift.io~v1~Route`]}>
      <RoutesList namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('RoutesList', () => {
  it('filters the list, reads the derived columns, and opens a route', async () => {
    serveRoutes();

    renderList();

    await waitFor(() => expect(screen.getByText('shop')).toBeInTheDocument());
    expect(screen.getByText('draft')).toBeInTheDocument();
    // The recording contains the two routes created from the Ingress plus the
    // storage route and the rejected-backend draft; every one was admitted.
    expect(screen.getAllByText('Accepted').length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText(/http:\/\/shop\.example\.com/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/http:\/\/www\.example\.com/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/http:\/\/example\.com/).length).toBeGreaterThanOrEqual(1);
    // The admitted routes point at the recorded service, so they inherit 2/2.
    expect(screen.getAllByText('2/2').length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByLabelText('filter'), 'shop');

    await waitFor(() => expect(screen.queryByText('draft')).not.toBeInTheDocument());
    expect(screen.getByText('shop')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'shop' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/route.openshift.io~v1~Route/shop`,
      ),
    );
  });

  it('navigates to the create form from the header button', async () => {
    serveRoutes();

    renderList();

    await waitFor(() => expect(screen.getByText('shop')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Create Route' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/route.openshift.io~v1~Route/~new/form`,
      ),
    );
  });
});
