import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import UserDefinedNetworksList from './UserDefinedNetworksList';

const NAMESPACE = 'cy-test-ns';
const UDNS = `*/apis/k8s.ovn.org/v1/namespaces/${NAMESPACE}/userdefinednetworks`;
const CUDNS = '*/apis/k8s.ovn.org/v1/clusteruserdefinednetworks';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const serveNetworks = () =>
  server.use(
    http.get(UDNS, () => HttpResponse.json(loadFixture('userdefinednetworks'))),
    http.get(CUDNS, () => HttpResponse.json(loadFixture('clusteruserdefinednetworks'))),
  );

const renderList = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/k8s.ovn.org~v1~UserDefinedNetwork`]}>
      <UserDefinedNetworksList namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('UserDefinedNetworksList', () => {
  it('lists user-defined networks, filters them, and opens one', async () => {
    serveNetworks();

    renderList();

    await waitFor(() => expect(screen.getByText('udn-layer2')).toBeInTheDocument());
    expect(screen.getByText('udn-layer3')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('filter'), 'layer3');

    await waitFor(() => expect(screen.queryByText('udn-layer2')).not.toBeInTheDocument());
    expect(screen.getByText('udn-layer3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'udn-layer3' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/k8s.ovn.org~v1~UserDefinedNetwork/udn-layer3`,
      ),
    );
  });

  it('opens the create choices from the header', async () => {
    serveNetworks();

    renderList();

    await waitFor(() => expect(screen.getByText('udn-layer2')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('button', { name: 'UserDefinedNetwork' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ClusterUserDefinedNetwork' })).toBeInTheDocument();
  });
});
