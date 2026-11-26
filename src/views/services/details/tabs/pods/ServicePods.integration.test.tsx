import * as React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../../../test/fixtures';
import { server } from '../../../../../test/msw';
import ServiceDetailsPage from '../../ServiceDetailsPage';

const NAMESPACE = 'cy-test-ns';
const SERVICE = 'web';

const service = loadFixture<{ items: Array<{ metadata: { name: string } }> }>(
  'services',
).items.find((item) => item.metadata.name === SERVICE);
type PodList = {
  apiVersion: string;
  items: Array<{ metadata: { labels?: Record<string, string>; name: string } }>;
  kind: string;
};

const PODS = loadFixture<PodList>('pods');

/* Answers the way the API server does: only pods matching the requested
 * labelSelector are returned, so a lost selector fails the test. */
const servePodsAndRecordSelector = (): { selector: () => null | string } => {
  let requested: null | string = null;

  server.use(
    http.get(`*/api/v1/namespaces/${NAMESPACE}/services/${SERVICE}`, () =>
      HttpResponse.json(service),
    ),
    // The service details page reads the EndpointsSlices behind the service to
    // show pod health; the recording is checked in with the other fixtures.
    http.get(`*/api/v1/namespaces/${NAMESPACE}/endpointslices`, () =>
      HttpResponse.json(loadFixture('endpointslices')),
    ),
    http.get(`*/api/v1/namespaces/${NAMESPACE}/pods`, ({ request }) => {
      requested = new URL(request.url).searchParams.get('labelSelector');

      const items = requested
        ? PODS.items.filter((item) =>
            requested.split(',').every((pair) => {
              const [key, value] = pair.split('=');
              return item.metadata.labels[key] === value;
            }),
          )
        : PODS.items;

      return HttpResponse.json({ ...PODS, items });
    }),
  );

  return { selector: () => requested };
};

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderDetails = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/core~v1~Service/${SERVICE}`]}>
      <ServiceDetailsPage name={SERVICE} namespace={NAMESPACE} />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('Service details Pods tab', () => {
  it('opens the Pods tab, lists the matching pods and filters them', async () => {
    const { selector } = servePodsAndRecordSelector();

    renderDetails();

    await waitFor(() => expect(screen.getByRole('heading', { name: /web/ })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('tab', { name: 'Pods' }));

    await waitFor(() => expect(screen.getByText('web-1')).toBeInTheDocument());
    expect(screen.getByText('web-2')).toBeInTheDocument();
    // The selector travels to the API, and the non-matching pod stays out.
    expect(selector()).toBe('app=web');
    expect(screen.queryByText('other-1')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('filter'), 'web-2');

    await waitFor(() => expect(screen.queryByText('web-1')).not.toBeInTheDocument());
    expect(screen.getByText('web-2')).toBeInTheDocument();
  });

  it('opens a pod from the tab', async () => {
    servePodsAndRecordSelector();

    renderDetails();

    await waitFor(() => expect(screen.getByRole('heading', { name: /web/ })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('tab', { name: 'Pods' }));

    await waitFor(() => expect(screen.getByText('web-1')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('link', { name: 'web-1' }));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        `/k8s/ns/${NAMESPACE}/core~v1~Pod/web-1`,
      ),
    );
  });
});
