import React from 'react';
import { http, HttpResponse } from 'msw';

import { describe, expect, it } from '@jest/globals';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GLOBAL_NAD_NAMESPACES,
  PROJECT_DEFAULT_NETWORK_ANNOTATION,
} from '@utils/resources/nads/constants';
import { parseGlobalNamespaces } from '@utils/resources/nads/helpers';

import { apiPath, setAccessReview } from '../../test/console-sdk-shim';
import { loadFixture } from '../../test/fixtures';
import { mockGet, mockList, server } from '../../test/msw';

import ProjectNetworkSettingsTab from './ProjectNetworkSettingsTab';

type NadList = {
  items: Array<{ metadata: { name: string; namespace: string } }>;
};

type MultusConfigMap = { data?: { 'daemon-config.json'?: string } };

const recordedNamespace = loadFixture<K8sResourceCommon>('projectsettings-namespace');
const recordedNamespaceWithSettings = loadFixture<K8sResourceCommon>(
  'projectsettings-namespace-with-settings',
);
const recordedMultus = loadFixture<MultusConfigMap>('multus-daemon-config');
const recordedNads = loadFixture<NadList>('projectsettings-nads');

const PROJECT = recordedNamespace.metadata?.name as string;
const MULTUS = apiPath('', 'v1', 'configmaps', 'openshift-multus');
const NADS = (namespace: string) =>
  apiPath('k8s.cni.cncf.io', 'v1', 'network-attachment-definitions', namespace);
const NAMESPACES = apiPath('', 'v1', 'namespaces');

const nadsIn = (namespace: string) =>
  recordedNads.items.filter((nad) => nad.metadata.namespace === namespace);

const mockCluster = () => {
  mockGet(`${MULTUS}/multus-daemon-config`, recordedMultus);
  mockList(NADS(PROJECT), nadsIn(PROJECT));
  // Multus globalNamespaces (includes custom-namespace) plus the GLOBAL fallback list.
  const watchedNamespaces = new Set([
    ...GLOBAL_NAD_NAMESPACES,
    ...parseGlobalNamespaces(recordedMultus.data?.['daemon-config.json'] ?? ''),
  ]);
  for (const namespace of watchedNamespaces) {
    mockList(NADS(namespace), nadsIn(namespace));
  }
};

const renderTab = (obj: K8sResourceCommon = recordedNamespace) =>
  render(<ProjectNetworkSettingsTab obj={obj} />);

const getNetworkInput = () => screen.getByRole('combobox') as HTMLInputElement;

const expectNetworkValue = (value: string) => {
  expect(getNetworkInput().value).toBe(value);
};

/** Open the select and wait until every expected option is present. */
const expectNetworkOptions = async (present: string[], absent: string[] = []) => {
  await userEvent.click(getNetworkInput());
  const listbox = await screen.findByRole('listbox');
  await waitFor(() => {
    for (const name of present) {
      expect(within(listbox).getByRole('option', { name })).toBeTruthy();
    }
  });
  for (const name of absent) {
    expect(within(listbox).queryByRole('option', { name })).toBeNull();
  }
  return listbox;
};

describe('ProjectNetworkSettingsTab over the recorded console API payloads', () => {
  it('renders the network settings form with Pod network pre-selected by default', async () => {
    mockCluster();
    renderTab();

    expect(await screen.findByRole('heading', { name: 'Network Settings' })).toBeTruthy();
    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      true,
    );
    expectNetworkValue('Pod network');
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('lists project and global NetworkAttachmentDefinitions in the select', async () => {
    mockCluster();
    renderTab();

    await expectNetworkOptions(
      [
        'Pod network',
        'local-bridge',
        'secondary-net',
        'custom-namespace/other-bridge',
        'default/shared-bridge',
      ],
      ['primary-udn'],
    );
  });

  it('loads annotations from the recorded namespace with settings', async () => {
    mockCluster();
    renderTab(recordedNamespaceWithSettings);

    expect(await screen.findByLabelText('Show Pod network option')).toBeTruthy();
    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      false,
    );
    expectNetworkValue('local-bridge');
  });

  it('shows the read-only alert when the user cannot patch the namespace', async () => {
    setAccessReview([false, false], {
      name: PROJECT,
      resource: 'namespaces',
      verb: 'patch',
    });
    mockCluster();
    renderTab();

    expect(await screen.findByText('Read-only')).toBeTruthy();
    expect(
      screen.getByText('Patch permission is required to edit project network settings.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('enables Save after the Pod network switch is toggled, and Cancel restores it', async () => {
    mockCluster();
    renderTab();

    const toggle = await screen.findByLabelText('Show Pod network option');
    await userEvent.click(toggle);

    expect((toggle as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
      false,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      true,
    );
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('clears then restores Pod network as the pre-selected network when Show Pod is toggled', async () => {
    mockCluster();
    // recordedNamespace has no kubevirt network-settings annotations.
    renderTab();

    const toggle = await screen.findByLabelText('Show Pod network option');
    expect((toggle as HTMLInputElement).checked).toBe(true);
    expectNetworkValue('Pod network');

    await userEvent.click(toggle);

    expect((toggle as HTMLInputElement).checked).toBe(false);
    expectNetworkValue('');

    await userEvent.click(toggle);

    expect((toggle as HTMLInputElement).checked).toBe(true);
    expectNetworkValue('Pod network');
  });

  it('shows Clear when a network is selected, and Clear empties the selection', async () => {
    mockCluster();
    renderTab();

    await expectNetworkOptions(['local-bridge']);
    await userEvent.click(screen.getByRole('option', { name: 'local-bridge' }));

    expectNetworkValue('local-bridge');
    const clear = screen.getByLabelText('Clear input value');
    expect(clear).toBeTruthy();

    await userEvent.click(clear);

    expectNetworkValue('');
    expect(screen.queryByLabelText('Clear input value')).toBeNull();
  });

  it('PATCHes the namespace when Save is clicked after selecting a NAD', async () => {
    const patches: unknown[] = [];
    server.use(
      http.patch(`${NAMESPACES}/:name`, async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json({
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: {
            annotations: {
              [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'local-bridge',
            },
            name: PROJECT,
          },
        });
      }),
    );

    mockCluster();
    renderTab();
    await expectNetworkOptions(['local-bridge']);
    await userEvent.click(screen.getByRole('option', { name: 'local-bridge' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

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
    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(
        true,
      ),
    );
  });

  it('shows a warning when a namespace NAD list fails to load', async () => {
    mockGet(`${MULTUS}/multus-daemon-config`, recordedMultus);
    mockList(NADS(PROJECT), nadsIn(PROJECT));
    const watchedNamespaces = new Set([
      ...GLOBAL_NAD_NAMESPACES,
      ...parseGlobalNamespaces(recordedMultus.data?.['daemon-config.json'] ?? ''),
    ]);
    for (const namespace of watchedNamespaces) {
      if (namespace === 'default') {
        server.use(
          http.get(NADS(namespace), () =>
            HttpResponse.json({ message: 'forbidden' }, { status: 403 }),
          ),
        );
        continue;
      }
      mockList(NADS(namespace), nadsIn(namespace));
    }

    renderTab();

    expect(await screen.findByText('Incomplete network attachment definitions')).toBeTruthy();
    expect(
      screen.getByText('Failed to load network attachment definitions from namespaces:'),
    ).toBeTruthy();
    expect(screen.getByText('default')).toBeTruthy();

    // NADs from namespaces that loaded successfully remain selectable.
    await expectNetworkOptions(
      ['Pod network', 'local-bridge', 'secondary-net', 'custom-namespace/other-bridge'],
      ['default/shared-bridge'],
    );
  });

  it('shows a concurrent-change warning when watched settings diverge from the local baseline', async () => {
    mockCluster();
    const { rerender } = render(<ProjectNetworkSettingsTab obj={recordedNamespace} />);

    expect(await screen.findByRole('heading', { name: 'Network Settings' })).toBeTruthy();
    expectNetworkValue('Pod network');

    rerender(<ProjectNetworkSettingsTab obj={recordedNamespaceWithSettings} />);

    expect(await screen.findByText('Network settings changed')).toBeTruthy();
    expect(screen.getByText('Network settings have been changed in the background')).toBeTruthy();
    // Form values are not auto-overwritten; Cancel resets to the new baseline.
    expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
      true,
    );
    expectNetworkValue('Pod network');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect((screen.getByLabelText('Show Pod network option') as HTMLInputElement).checked).toBe(
        false,
      );
      expectNetworkValue('local-bridge');
      expect(screen.queryByText('Network settings changed')).toBeNull();
    });
  });
});
