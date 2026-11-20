import React from 'react';
import { http, HttpResponse } from 'msw';
import { settle } from 'src/__mocks__/integration/act';
import { consoleApiPath, mockGet, mockList } from 'src/__mocks__/integration/api';
import { setAccessReview } from 'src/__mocks__/integration/dynamic-plugin-sdk';
import recordedMultus from 'src/__mocks__/integration/recordings/multus-daemon-config.json' with { type: 'json' };
import recordedNads from 'src/__mocks__/integration/recordings/nads.json' with { type: 'json' };
import recordedNamespace from 'src/__mocks__/integration/recordings/namespace.json' with { type: 'json' };
import { server } from 'src/__mocks__/integration/server';

import { describe, expect, it } from '@jest/globals';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MULTUS_DAEMON_CONFIG_NAME, OPENSHIFT_MULTUS_NS } from '@utils/resources/nads/constants';

import ProjectNetworkSettingsTab from './ProjectNetworkSettingsTab';

const PROJECT = recordedNamespace.metadata.name;
const MULTUS = consoleApiPath('', 'v1', 'configmaps', 'openshift-multus');
const NADS = (namespace: string) =>
  consoleApiPath('k8s.cni.cncf.io', 'v1', 'network-attachment-definitions', namespace);
const NAMESPACES = consoleApiPath('', 'v1', 'namespaces');

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
  mockList(NADS('default'), nadsIn('default'));
};

const flushWatches = async () => {
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
  it('hides global NADs under impersonation without Multus access, then saves a project NAD', async () => {
    mockCluster();
    const { rerender } = render(
      <ProjectNetworkSettingsTab obj={recordedNamespace as K8sResourceCommon} />,
    );
    await flushWatches();

    // Regular user: project + Multus globalNamespace NADs are listed.
    await openNetworkSelect();
    let menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Pod network' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'local-bridge' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'secondary-net' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'default/shared-bridge' })).toBeTruthy();
    // Close the menu before re-rendering as the impersonated user.
    fireEvent.click(screen.getByRole('button', { name: /Pod network/ }));
    await settle();

    denyMultusForImpersonate(TEST_IMPERSONATE);
    rerender(
      <ProjectNetworkSettingsTab
        impersonate={TEST_IMPERSONATE}
        obj={recordedNamespace as K8sResourceCommon}
      />,
    );
    await flushWatches();

    // Impersonated user cannot read Multus config → only the project namespace is watched.
    await openNetworkSelect();
    menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Pod network' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'local-bridge' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'secondary-net' })).toBeTruthy();
    expect(within(menu).queryByRole('menuitem', { name: 'default/shared-bridge' })).toBeNull();

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

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'local-bridge' }));
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
});
