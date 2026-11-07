import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { server } from '../../../test/msw';

import { generateDefaultService } from './utils/utils';
import ServiceForm from './ServiceForm';

const NAMESPACE = 'cy-test-ns';

const renderForm = () =>
  render(
    <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/core~v1~Service/~new/form`]}>
      <ServiceForm formData={generateDefaultService(NAMESPACE)} onChange={() => undefined} />
    </MemoryRouter>,
  );

describe('ServiceForm', () => {
  it('creates the Service described by the form', async () => {
    let posted: { metadata?: Record<string, unknown>; spec?: Record<string, unknown> };

    server.use(
      http.post(`*/api/v1/namespaces/${NAMESPACE}/services`, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(posted, { status: 201 });
      }),
    );

    renderForm();

    const name = screen.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'web');

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(posted).toBeDefined());

    expect(posted.metadata).toMatchObject({ name: 'web', namespace: NAMESPACE });
    expect(posted.spec).toMatchObject({ selector: { app: 'MyApp' }, type: 'ClusterIP' });
    expect(posted.spec?.ports).toEqual([
      expect.objectContaining({ port: 80, protocol: 'TCP', targetPort: 9376 }),
    ]);
  });

  it('does not send a request while the form is invalid', async () => {
    let requested = false;

    server.use(
      http.post(`*/api/v1/namespaces/${NAMESPACE}/services`, () => {
        requested = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    renderForm();

    const ports = screen.getByLabelText('Ports');
    await userEvent.clear(ports);

    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toBeDisabled();
    await userEvent.click(create);
    expect(requested).toBe(false);
  });

  it('updates an existing Service instead of creating one', async () => {
    let put: { metadata?: Record<string, unknown>; spec?: Record<string, unknown> };

    server.use(
      http.put(`*/api/v1/namespaces/${NAMESPACE}/services/web`, async ({ request }) => {
        put = (await request.json()) as typeof put;
        return HttpResponse.json(put, { status: 200 });
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/k8s/ns/${NAMESPACE}/core~v1~Service/web/form`]}>
        <ServiceForm
          formData={{
            ...generateDefaultService(NAMESPACE),
            metadata: { name: 'web', namespace: NAMESPACE },
          }}
          onChange={() => undefined}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(put).toBeDefined());
    expect(put.metadata).toMatchObject({ name: 'web', namespace: NAMESPACE });
    expect(put.spec).toMatchObject({ selector: { app: 'MyApp' }, type: 'ClusterIP' });
  });
});
