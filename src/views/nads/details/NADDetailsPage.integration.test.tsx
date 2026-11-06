import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { loadFixture, loadListFixture } from '../../../test/fixtures';
import { server } from '../../../test/msw';

import NADDetailsPage from './NADDetailsPage';

const NAMESPACE = 'cy-test-ns';
const NAD_NAME = 'udn-layer2';

type Nad = { metadata?: { name?: string; namespace?: string } };

const nad = loadListFixture<Nad>('networkattachmentdefinitions').find(
  (item) => item.metadata?.name === NAD_NAME,
);

const VIRTUAL_MACHINES = loadFixture('virtualmachines');

const serve = () => {
  server.use(
    http.get(
      `*/apis/k8s.cni.cncf.io/v1/namespaces/${NAMESPACE}/network-attachment-definitions/${NAD_NAME}`,
      () => HttpResponse.json(nad),
    ),
    http.get('*/apis/kubevirt.io/v1/virtualmachines', () => HttpResponse.json(VIRTUAL_MACHINES)),
    http.get('*/apis/kubevirt.io/v1/virtualmachineinstances', () =>
      HttpResponse.json(loadFixture('virtualmachineinstances')),
    ),
    http.get('*/apis/instancetype.kubevirt.io/v1beta1/virtualmachineclusterinstancetypes', () =>
      HttpResponse.json(loadFixture('virtualmachineclusterinstancetypes')),
    ),
    http.get('*/apis/instancetype.kubevirt.io/v1beta1/virtualmachineinstancetypes', () =>
      HttpResponse.json(loadFixture('virtualmachineinstancetypes')),
    ),
  );
};

const renderDetails = () =>
  render(
    <MemoryRouter
      initialEntries={[
        `/k8s/ns/${NAMESPACE}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/${NAD_NAME}`,
      ]}
    >
      <NADDetailsPage name={NAD_NAME} namespace={NAMESPACE} />
    </MemoryRouter>,
  );

describe('NAD details Virtual Machines tab', () => {
  it('opens the tab, lists attached VMs and filters them', async () => {
    serve();

    renderDetails();

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: new RegExp(NAD_NAME) })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('tab', { name: /Virtual Machines/ }));

    await waitFor(() => expect(screen.getByText('vm-plain')).toBeInTheDocument());
    expect(screen.getByText('vm-qualified')).toBeInTheDocument();
    expect(screen.queryByText('vm-other')).not.toBeInTheDocument();
    expect(screen.queryByText('vm-detached')).not.toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Search by name...'), 'qualified');

    await waitFor(() => expect(screen.queryByText('vm-plain')).not.toBeInTheDocument());
    expect(screen.getByText('vm-qualified')).toBeInTheDocument();
  });

  it('opens the Add virtual machines dialog', async () => {
    serve();

    renderDetails();

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: new RegExp(NAD_NAME) })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('tab', { name: /Virtual Machines/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add virtual machines' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
