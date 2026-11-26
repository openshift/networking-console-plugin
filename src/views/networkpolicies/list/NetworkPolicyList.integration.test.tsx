import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import NetworkPolicyList from './NetworkPolicyList';

const NAMESPACE = 'cy-test-ns';
const COLLECTION = `*/apis/networking.k8s.io/v1/namespaces/${NAMESPACE}/networkpolicies`;

const POLICIES = loadFixture('networkpolicies');

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderList = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~NetworkPolicy`]}>
      <NetworkPolicyList namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('NetworkPolicyList', () => {
  it('lists the policies, filters them, and opens one', async () => {
    server.use(http.get(COLLECTION, () => HttpResponse.json(POLICIES)));

    renderList();

    await waitFor(() => expect(screen.getByText('deny-all')).toBeInTheDocument());
    expect(screen.getByText('allow-web')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('filter'), 'allow');

    await waitFor(() => expect(screen.queryByText('deny-all')).not.toBeInTheDocument());
    expect(screen.getByText('allow-web')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'allow-web' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~NetworkPolicy/allow-web`,
      ),
    );
  });

  it('shows the empty state and opens the create form when no policies exist', async () => {
    server.use(http.get(COLLECTION, () => HttpResponse.json({ items: [] })));

    renderList();

    await waitFor(() => expect(screen.getByText('No NetworkPolicy found')).toBeInTheDocument());
    const create = screen.getByRole('button', { name: 'Create NetworkPolicy' });
    await userEvent.click(create);

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~NetworkPolicy/~new/form`,
      ),
    );
  });
});
