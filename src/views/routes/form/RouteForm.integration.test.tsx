import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import RouteForm from './RouteForm';
import { generateDefaultRoute } from './utils';

const NAMESPACE = 'cy-test-ns';

describe('RouteForm', () => {
  it('creates the Route described by the form', async () => {
    let posted: { metadata?: Record<string, unknown>; spec?: Record<string, unknown> };

    server.use(
      http.get(`*/api/v1/namespaces/${NAMESPACE}/services`, () =>
        HttpResponse.json(loadFixture('services')),
      ),
      http.post(
        `*/apis/route.openshift.io/v1/namespaces/${NAMESPACE}/routes`,
        async ({ request }) => {
          posted = (await request.json()) as typeof posted;
          return HttpResponse.json(posted, { status: 201 });
        },
      ),
    );

    const { container } = render(
      <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/route.openshift.io~v1~Route/~new/form`]}>
        <RouteForm formData={generateDefaultRoute(NAMESPACE)} onChange={() => undefined} />
      </MemoryRouter>,
    );

    // The form's labels are visual only, so fields are addressed by id.
    const name = container.querySelector('#name');
    await userEvent.clear(name);
    await userEvent.type(name, 'shop');

    const host = container.querySelector('#host');
    await userEvent.type(host, 'shop.example.com');

    // The Route needs a backend, and the selector loads the recorded service.
    await userEvent.click(await screen.findByRole('button', { name: /select a service/i }));
    await userEvent.click(await screen.findByText('web'));

    // Selecting a service exposes its ports, and one must be chosen.
    await userEvent.click(await screen.findByText('Select target port'));
    await userEvent.click(await screen.findByText(/8080/));

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(posted).toBeDefined());

    expect(posted.metadata).toMatchObject({ name: 'shop', namespace: NAMESPACE });
    expect(posted.spec).toMatchObject({ host: 'shop.example.com' });
  });
});
