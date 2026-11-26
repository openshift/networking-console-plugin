import React from 'react';
import { http, HttpResponse } from 'msw';

import { describe, expect, it } from '@jest/globals';
import { NetworkAttachmentDefinitionModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GLOBAL_NAD_NAMESPACES,
  MULTUS_DAEMON_CONFIG_NAME,
  OPENSHIFT_MULTUS_NS,
  PROJECT_DEFAULT_NETWORK_ANNOTATION,
} from '@utils/resources/nads/constants';
import { parseGlobalNamespaces } from '@utils/resources/nads/helpers';

import { apiPath, setAccessReview } from '../../test/console-sdk-shim';
import { loadFixture } from '../../test/fixtures';
import { mockGet, mockList, server } from '../../test/msw';

import { TestComponent as ProjectNetworkSettingsTab } from './ProjectNetworkSettingsTab';

type NadList = {
  items: Array<{ metadata: { name: string; namespace: string } }>;
};

type MultusConfigMap = { data?: { 'daemon-config.json'?: string } };

const recordedNamespace = loadFixture<K8sResourceCommon>('projectsettings-namespace');
const recordedMultus = loadFixture<MultusConfigMap>('multus-daemon-config');
const recordedNads = loadFixture<NadList>('projectsettings-nads');

const PROJECT = recordedNamespace.metadata?.name as string;
const MULTUS = apiPath('', 'v1', 'configmaps', 'openshift-multus');
const NADS = (namespace: string) =>
  apiPath('k8s.cni.cncf.io', 'v1', 'network-attachment-definitions', namespace);
const NAMESPACES = apiPath('', 'v1', 'namespaces');

const TEST_IMPERSONATE = {
  kind: 'User',
  name: 'test',
  subprotocols: ['Impersonate-User.dGVzdA__'],
};

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

const getNetworkInput = () => screen.getByRole('combobox') as HTMLInputElement;

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

/** Deny Multus daemon-config reads for the impersonated user; leave namespace patch allowed. */
const denyMultusForImpersonate = (impersonate: typeof TEST_IMPERSONATE) => {
  setAccessReview(
    [false, false],
    {
      name: MULTUS_DAEMON_CONFIG_NAME,
      namespace: OPENSHIFT_MULTUS_NS,
      resource: 'configmaps',
      verb: 'get',
    },
    impersonate,
  );
  setAccessReview(
    [true, false],
    {
      name: PROJECT,
      resource: 'namespaces',
      verb: 'patch',
    },
    impersonate,
  );
};

describe('ProjectNetworkSettingsTab impersonation', () => {
  it('falls back to GLOBAL_NAD_NAMESPACES when Multus is denied, and can save a project NAD', async () => {
    mockCluster();
    const { rerender } = render(<ProjectNetworkSettingsTab obj={recordedNamespace} />);

    // Regular user: project + Multus globalNamespace NADs are listed.
    let listbox = await expectNetworkOptions([
      'Pod network',
      'local-bridge',
      'secondary-net',
      'custom-namespace/other-bridge',
      'default/shared-bridge',
    ]);
    // Close the menu before re-rendering as the impersonated user.
    await userEvent.click(getNetworkInput());

    denyMultusForImpersonate(TEST_IMPERSONATE);
    rerender(<ProjectNetworkSettingsTab impersonate={TEST_IMPERSONATE} obj={recordedNamespace} />);

    // Without Multus config access, useGlobalNamespaces falls back to GLOBAL_NAD_NAMESPACES
    // (still filtered by per-namespace NAD list access), so default/shared-bridge remains
    // and Multus-only custom-namespace/other-bridge is gone.
    listbox = await expectNetworkOptions(
      ['Pod network', 'local-bridge', 'secondary-net', 'default/shared-bridge'],
      ['custom-namespace/other-bridge'],
    );

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

    await userEvent.click(within(listbox).getByRole('option', { name: 'local-bridge' }));
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

  it('hides a fallback global namespace when NAD list access is denied under impersonation', async () => {
    mockCluster();
    denyMultusForImpersonate(TEST_IMPERSONATE);
    setAccessReview(
      [false, false],
      {
        group: NetworkAttachmentDefinitionModel.apiGroup,
        namespace: 'default',
        resource: NetworkAttachmentDefinitionModel.plural,
        verb: 'list',
      },
      TEST_IMPERSONATE,
    );

    render(<ProjectNetworkSettingsTab impersonate={TEST_IMPERSONATE} obj={recordedNamespace} />);

    await expectNetworkOptions(['local-bridge'], ['default/shared-bridge']);
  });
});
