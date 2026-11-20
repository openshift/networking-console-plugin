import React from 'react';
import { http, HttpResponse } from 'msw';
import { settle } from 'src/__mocks__/integration/act';
import { consoleApiPath, mockGet, mockList } from 'src/__mocks__/integration/api';
import { setAccessReview } from 'src/__mocks__/integration/dynamic-plugin-sdk';
import recordedMultus from 'src/__mocks__/integration/recordings/multus-daemon-config.json' with { type: 'json' };
import recordedNads from 'src/__mocks__/integration/recordings/nads.json' with { type: 'json' };
import recordedNamespace from 'src/__mocks__/integration/recordings/namespace.json' with { type: 'json' };
import recordedNamespaceWithSettings from 'src/__mocks__/integration/recordings/namespace-with-settings.json' with { type: 'json' };
import { server } from 'src/__mocks__/integration/server';

import { describe, expect, it } from '@jest/globals';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import ProjectNetworkSettingsTab from './ProjectNetworkSettingsTab';

const PROJECT = recordedNamespace.metadata.name;
const MULTUS = consoleApiPath('', 'v1', 'configmaps', 'openshift-multus');
const NADS = (namespace: string) =>
  consoleApiPath('k8s.cni.cncf.io', 'v1', 'network-attachment-definitions', namespace);
const NAMESPACES = consoleApiPath('', 'v1', 'namespaces');

const nadsIn = (namespace: string) =>
  recordedNads.items.filter((nad) => nad.metadata.namespace === namespace);

const mockCluster = () => {
  mockGet(`${MULTUS}/multus-daemon-config`, recordedMultus);
  mockList(NADS(PROJECT), nadsIn(PROJECT));
  mockList(NADS('default'), nadsIn('default'));
};

const renderTab = async (obj: K8sResourceCommon = recordedNamespace as K8sResourceCommon) => {
  render(<ProjectNetworkSettingsTab obj={obj} />);
  // Multus config → NAD access reviews → NAD lists: flush a few microtask turns.
  await settle();
  await settle();
  await settle();
};

const openNetworkSelect = async () => {
  fireEvent.click(
    await screen.findByRole('button', { name: /Pod network|Select a network|local-bridge/ }),
  );
  await settle();
};

describe('ProjectNetworkSettingsTab over the recorded console API payloads', () => {
  it('renders the network settings form with Pod network pre-selected by default', async () => {
    mockCluster();
    await renderTab();

    expect(await screen.findByRole('heading', { name: 'Network Settings' })).toBeTruthy();
    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: /Pod network/ })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('lists project and global NetworkAttachmentDefinitions in the select', async () => {
    mockCluster();
    await renderTab();
    await openNetworkSelect();

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Pod network' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'local-bridge' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'secondary-net' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'default/shared-bridge' })).toBeTruthy();
    // Primary UDN NADs are filtered out of the pre-selected network options.
    expect(within(menu).queryByRole('menuitem', { name: 'primary-udn' })).toBeNull();
  });

  it('loads annotations from the recorded namespace with settings', async () => {
    mockCluster();
    await renderTab(recordedNamespaceWithSettings as K8sResourceCommon);

    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      false,
    );
    expect(await screen.findByRole('button', { name: /local-bridge/ })).toBeTruthy();
  });

  it('shows the read-only alert when the user cannot patch the namespace', async () => {
    setAccessReview([false, false], {
      name: PROJECT,
      resource: 'namespaces',
      verb: 'patch',
    });
    mockCluster();
    await renderTab();

    expect(await screen.findByText('Read-only')).toBeTruthy();
    expect(
      screen.getByText('Patch permission is required to edit project network settings.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('enables Save after the Pod network switch is toggled, and Cancel restores it', async () => {
    mockCluster();
    await renderTab();

    const toggle = screen.getByLabelText('Show Pod network option') as HTMLInputElement;
    fireEvent.click(toggle);
    await settle();

    expect(toggle.checked).toBe(false);
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      false,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await settle();

    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      true,
    );
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('clears then restores Pod network as the pre-selected network when Show Pod is toggled', async () => {
    mockCluster();
    // recordedNamespace has no kubevirt network-settings annotations.
    await renderTab();

    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: /Pod network/ })).toBeTruthy();

    const toggle = screen.getByLabelText('Show Pod network option') as HTMLInputElement;
    fireEvent.click(toggle);
    await settle();

    expect(toggle.checked).toBe(false);
    expect(screen.getByRole('button', { name: /Select a network/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Pod network/ })).toBeNull();

    fireEvent.click(toggle);
    await settle();

    expect(toggle.checked).toBe(true);
    expect(screen.getByRole('button', { name: /Pod network/ })).toBeTruthy();
  });

  it('shows Clear after selecting a NAD and disabling Show Pod, and Clear empties the selection', async () => {
    mockCluster();
    await renderTab();

    await openNetworkSelect();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'local-bridge' }));
    await settle();

    expect(screen.getByRole('button', { name: /local-bridge/ })).toBeTruthy();
    expect(screen.queryByLabelText('Clear')).toBeNull();

    fireEvent.click(screen.getByLabelText('Show Pod network option'));
    await settle();

    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      false,
    );
    expect(screen.getByRole('button', { name: /local-bridge/ })).toBeTruthy();
    const clear = screen.getByLabelText('Clear');
    expect(clear).toBeTruthy();

    fireEvent.click(clear);
    await settle();

    expect(screen.getByRole('button', { name: /Select a network/ })).toBeTruthy();
    expect(screen.queryByLabelText('Clear')).toBeNull();
    expect(screen.queryByRole('button', { name: /local-bridge/ })).toBeNull();
  });

  it('PATCHes the namespace when Save is clicked after selecting a NAD', async () => {
    const patches: unknown[] = [];
    server.use(
      http.patch(`${NAMESPACES}/:name`, async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json({
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: { name: PROJECT },
        });
      }),
    );

    mockCluster();
    await renderTab();
    await openNetworkSelect();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'local-bridge' }));
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await settle();

    await waitFor(() => expect(patches.length).toBe(1));
    expect(patches[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'add',
          path: '/metadata/annotations/kubevirt.io~1default-network',
          value: 'local-bridge',
        }),
      ]),
    );
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows a warning when a namespace NAD list fails to load', async () => {
    mockGet(`${MULTUS}/multus-daemon-config`, recordedMultus);
    mockList(NADS(PROJECT), nadsIn(PROJECT));
    server.use(
      http.get(NADS('default'), () => HttpResponse.json({ message: 'forbidden' }, { status: 403 })),
    );

    await renderTab();

    expect(await screen.findByText('Incomplete network attachment definitions')).toBeTruthy();
    expect(
      screen.getByText('Failed to load network attachment definitions from namespaces:'),
    ).toBeTruthy();
    expect(screen.getByText('default')).toBeTruthy();

    // NADs from namespaces that loaded successfully remain selectable.
    await openNetworkSelect();
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Pod network' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'local-bridge' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'secondary-net' })).toBeTruthy();
    expect(within(menu).queryByRole('menuitem', { name: 'default/shared-bridge' })).toBeNull();
  });
});
