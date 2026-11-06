import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import NetworkPolicyPage from './NetworkPolicyPage';

const NAMESPACE = 'cy-test-ns';
const NETWORK_CONFIG = '*/apis/operator.openshift.io/v1/networks/cluster';
const POLICIES = `*/apis/networking.k8s.io/v1/namespaces/${NAMESPACE}/networkpolicies`;

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('NetworkPolicyPage', () => {
  it('opens the already-enabled multi-network tab and its create form', async () => {
    server.use(
      http.get(NETWORK_CONFIG, () => HttpResponse.json(loadFixture('networkconfig'))),
      http.get(POLICIES, () => HttpResponse.json(loadFixture('networkpolicies'))),
      http.get(`*/apis/k8s.cni.cncf.io/v1beta1/namespaces/${NAMESPACE}/multi-networkpolicies`, () =>
        HttpResponse.json(loadFixture('multinetworkpolicies')),
      ),
    );

    render(
      <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/networking.k8s.io~v1~NetworkPolicy`]}>
        <NetworkPolicyPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole('tab', { name: 'MultiNetworkPolicies' }));

    expect(
      await screen.findByRole('heading', { name: 'MultiNetworkPolicies' }),
    ).toBeInTheDocument();
    /* The recorded MultiNetworkPolicy list is empty, so the tab renders its empty
     * state, and the page header offers an identically named create button.
     * Scope the click to the tab panel. */
    const tabPanel = await screen.findByRole('tabpanel');
    const create = await within(tabPanel).findByRole('button', {
      name: 'Create MultiNetworkPolicy',
    });
    await userEvent.click(create);

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1beta1~MultiNetworkPolicy/~new/form`,
      ),
    );
  });
});
