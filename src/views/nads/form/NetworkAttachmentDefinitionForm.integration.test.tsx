import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import { generateDefaultNAD } from './utils/constants';
import NetworkAttachmentDefinitionForm from './NetworkAttachmentDefinitionForm';

const NAMESPACE = 'cy-test-ns';
const COLLECTION = `*/apis/k8s.cni.cncf.io/v1/namespaces/${NAMESPACE}/network-attachment-definitions`;
const NETWORK_CONFIG = '*/apis/operator.openshift.io/v1/networks/cluster';

const renderForm = () =>
  render(
    <MemoryRouter
      initialEntries={[
        `/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/~new/form`,
      ]}
    >
      <NetworkAttachmentDefinitionForm
        formData={generateDefaultNAD(NAMESPACE) as never}
        onChange={() => undefined}
      />
    </MemoryRouter>,
  );

const selectNetworkType = async (label: string) => {
  await userEvent.click(screen.getByRole('button', { name: /Network Type/ }));
  await userEvent.click(await screen.findByText(label));
};

describe('NetworkAttachmentDefinitionForm', () => {
  it('creates a Linux bridge network from the form', async () => {
    let posted: {
      metadata?: Record<string, unknown>;
      spec?: Record<string, unknown>;
    };

    server.use(
      http.get(NETWORK_CONFIG, () => HttpResponse.json(loadFixture('networkconfig'))),
      http.post(COLLECTION, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(posted, { status: 201 });
      }),
    );

    const { container } = renderForm();

    const name = container.querySelector('input[name="name"]');
    await userEvent.clear(name);
    await userEvent.type(name, 'bridge-net');

    await selectNetworkType('Linux bridge');
    await userEvent.type(container.querySelector('input[name="bridge.bridge"]'), 'br0');

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(posted).toBeDefined());
    expect(posted.metadata).toMatchObject({ name: 'bridge-net', namespace: NAMESPACE });
    expect(JSON.parse(posted.spec.config as string)).toMatchObject({
      bridge: 'br0',
      cniVersion: '0.3.1',
      type: 'bridge',
    });
    expect(posted.metadata.annotations).toMatchObject({
      'k8s.v1.cni.cncf.io/resourceName': 'bridge.network.kubevirt.io/br0',
    });
  });

  it('creates an OVN secondary localnet network from the form', async () => {
    let posted: {
      metadata?: Record<string, unknown>;
      spec?: Record<string, unknown>;
    };

    server.use(
      http.get(NETWORK_CONFIG, () => HttpResponse.json(loadFixture('networkconfig'))),
      http.get('*/apis/nmstate.io/v1beta1/nodenetworkstates', () =>
        HttpResponse.json(loadFixture('nodenetworkstates')),
      ),
      http.post(COLLECTION, async ({ request }) => {
        posted = (await request.json()) as typeof posted;
        return HttpResponse.json(posted, { status: 201 });
      }),
    );

    const { container } = renderForm();

    const name = container.querySelector('input[name="name"]');
    await userEvent.clear(name);
    await userEvent.type(name, 'localnet-net');

    await selectNetworkType('OVN Kubernetes secondary localnet network');
    await userEvent.type(
      container.querySelector('[data-test="nads-ovn-physical-network-name"]'),
      'physnet',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(posted).toBeDefined());
    expect(JSON.parse(posted.spec.config as string)).toMatchObject({
      cniVersion: '0.4.0',
      name: 'localnet-net',
      physicalNetworkName: 'physnet',
      topology: 'localnet',
      type: 'ovn-k8s-cni-overlay',
    });
  });

  it('does not submit a bridge network without a bridge name', async () => {
    let requested = false;

    server.use(
      http.get(NETWORK_CONFIG, () => HttpResponse.json(loadFixture('networkconfig'))),
      http.post(COLLECTION, () => {
        requested = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const { container } = renderForm();
    const name = container.querySelector('input[name="name"]');
    await userEvent.clear(name);
    await userEvent.type(name, 'invalid-net');
    await selectNetworkType('Linux bridge');

    const create = await screen.findByRole('button', { name: 'Create' });
    expect(create).toBeDisabled();
    await userEvent.click(create);
    expect(requested).toBe(false);
  });
});
