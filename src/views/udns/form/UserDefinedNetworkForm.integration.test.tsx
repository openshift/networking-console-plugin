import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { server } from '../../../test/msw';

import { generateDefaultCUDN, generateDefaultUDN } from './utils/constants';
import UserDefinedNetworkForm from './UserDefinedNetworkForm';

const NAMESPACE = 'cy-test-ns';
const UDN_COLLECTION = `*/apis/k8s.ovn.org/v1/namespaces/${NAMESPACE}/userdefinednetworks`;
const CUDN_COLLECTION = '*/apis/k8s.ovn.org/v1/clusteruserdefinednetworks';

const renderForm = (formData: unknown) =>
  render(
    <MemoryRouter>
      <UserDefinedNetworkForm formData={formData as never} onChange={() => undefined} />
    </MemoryRouter>,
  );

const fillName = async (value: string) => {
  const name = document.querySelector('input[name="name"]');
  await userEvent.clear(name);
  await userEvent.type(name, value);
};

describe('UserDefinedNetworkForm', () => {
  it('creates a namespaced UserDefinedNetwork from the form', async () => {
    let posted: {
      kind?: string;
      metadata?: Record<string, unknown>;
      spec?: Record<string, unknown>;
    };

    server.use(
      http.post(UDN_COLLECTION, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(posted, { status: 201 });
      }),
    );

    renderForm(generateDefaultUDN());
    await fillName('team-net');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(posted).toBeDefined());
    expect(posted.kind).toBe('UserDefinedNetwork');
    expect(posted.metadata).toMatchObject({ name: 'team-net', namespace: NAMESPACE });
    expect(posted.spec).toMatchObject({
      layer2: { role: 'Primary' },
      topology: 'Layer2',
    });
  });

  it('creates a ClusterUserDefinedNetwork wrapping the network and selector', async () => {
    let posted: {
      kind?: string;
      metadata?: Record<string, unknown>;
      spec?: Record<string, unknown>;
    };

    server.use(
      http.post(CUDN_COLLECTION, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(posted, { status: 201 });
      }),
    );

    renderForm(generateDefaultCUDN());
    await fillName('cluster-net');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(posted).toBeDefined());
    expect(posted.kind).toBe('ClusterUserDefinedNetwork');
    expect(posted.metadata).toMatchObject({ name: 'cluster-net' });
    expect(posted.spec).toMatchObject({
      namespaceSelector: { matchExpressions: [], matchLabels: {} },
      network: {
        layer2: { role: 'Primary' },
        topology: 'Layer2',
      },
    });
  });
});
