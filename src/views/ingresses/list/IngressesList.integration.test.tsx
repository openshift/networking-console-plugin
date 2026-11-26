import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import IngressesList from './IngressesList';

const NAMESPACE = 'cy-test-ns';
const COLLECTION = `*/apis/networking.k8s.io/v1/namespaces/${NAMESPACE}/ingresses`;

const INGRESSES = loadFixture('ingresses');

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderList = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~Ingress`]}>
      <IngressesList namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('IngressesList', () => {
  it('lists ingresses with their hosts, filters them, and opens one', async () => {
    server.use(http.get(COLLECTION, () => HttpResponse.json(INGRESSES)));

    renderList();

    await waitFor(() => expect(screen.getByText('shop')).toBeInTheDocument());
    expect(screen.getByText('shop.example.com, www.example.com')).toBeInTheDocument();
    expect(screen.getByText('no-rules')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('filter'), 'shop');

    await waitFor(() => expect(screen.queryByText('no-rules')).not.toBeInTheDocument());
    expect(screen.getByText('shop')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'shop' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~Ingress/shop`,
      ),
    );
  });

  it('navigates to the create page from the header button', async () => {
    server.use(http.get(COLLECTION, () => HttpResponse.json(INGRESSES)));

    renderList();

    await waitFor(() => expect(screen.getByText('shop')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Create Ingress' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~Ingress/~new`,
      ),
    );
  });

  it('offers to create an ingress when none exists', async () => {
    server.use(http.get(COLLECTION, () => HttpResponse.json({ items: [] })));

    renderList();

    const create = await screen.findByRole('button', { name: 'Create Ingress' });
    expect(create).toBeInTheDocument();
    expect(screen.queryByText('shop')).not.toBeInTheDocument();

    await userEvent.click(create);
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~Ingress/~new`,
      ),
    );
  });

  it('opens Edit Ingress on the canonical YAML route', async () => {
    server.use(http.get(COLLECTION, () => HttpResponse.json(INGRESSES)));

    renderList();

    await waitFor(() => expect(screen.getByText('shop')).toBeInTheDocument());
    const row = screen.getByText('shop').closest('tr');
    await userEvent.click(within(row).getByRole('button'));
    await userEvent.click(await screen.findByText('Edit Ingress'));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~Ingress/shop/yaml`,
      ),
    );
  });
});
