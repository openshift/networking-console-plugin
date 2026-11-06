import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setTestFlag } from '../../test/console-sdk-shim';
import { loadFixture } from '../../test/fixtures';
import { server } from '../../test/msw';

import CreateProjectModal from './CreateProjectModal';

const PROJECT = 'team-project';
const CUDN_NAME = 'test-cudn-team';

type PatchOp = { op: string; path: string; value?: unknown };

describe('CreateProjectModal', () => {
  it('creates a project and adds it to the selected ClusterUserDefinedNetwork', async () => {
    setTestFlag('CAN_LIST_NS', true);

    let postedProject: { metadata?: Record<string, unknown> };
    let patchOps: PatchOp[];

    server.use(
      http.get('*/apis/k8s.ovn.org/v1/clusteruserdefinednetworks', () =>
        HttpResponse.json(loadFixture('clusteruserdefinednetworks')),
      ),
      http.post('*/apis/project.openshift.io/v1/projectrequests', async ({ request }) => {
        postedProject = (await request.json()) as typeof postedProject;
        return HttpResponse.json({ ...postedProject, kind: 'Project' }, { status: 201 });
      }),
      http.patch(
        `*/apis/k8s.ovn.org/v1/clusteruserdefinednetworks/${CUDN_NAME}`,
        async ({ request }) => {
          patchOps = (await request.json()) as PatchOp[];
          return HttpResponse.json({}, { status: 200 });
        },
      ),
    );

    render(
      <MemoryRouter initialEntries={['/k8s/cluster/projects']}>
        <CreateProjectModal closeModal={() => undefined} onSubmit={() => undefined} />
      </MemoryRouter>,
    );

    const name = document.querySelector('#input-name');
    await userEvent.type(name, PROJECT);

    await userEvent.click(screen.getByRole('tab', { name: 'Network' }));
    await userEvent.click(document.querySelector('#toggle-network-type'));
    await userEvent.click(await screen.findByText('Refer an existing ClusterUserDefinedNetwork'));

    await userEvent.click(
      await screen.findByRole('button', { name: 'Select ClusterUserDefinedNetwork' }),
    );
    await userEvent.click(await screen.findByText(CUDN_NAME));

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(postedProject).toBeDefined());
    expect(postedProject.metadata).toMatchObject({ name: PROJECT });

    await waitFor(() => expect(patchOps).toBeDefined());
    expect(patchOps).toEqual([
      {
        op: 'remove',
        path: '/spec/namespaceSelector/matchLabels/kubernetes.io~1metadata.name',
      },
      {
        op: 'add',
        path: '/spec/namespaceSelector/matchExpressions',
        value: [
          { key: 'kubernetes.io/metadata.name', operator: 'In', values: ['cy-test-ns', PROJECT] },
        ],
      },
    ]);
  });
  it('shows an error when the selected CUDN has a narrowing selector', async () => {
    setTestFlag('CAN_LIST_NS', true);
    const narrowingCUDN = {
      apiVersion: 'k8s.ovn.org/v1',
      kind: 'ClusterUserDefinedNetwork',
      metadata: {
        labels: { 'app.kubernetes.io/managed-by': 'networking-console-plugin-test' },
        name: CUDN_NAME,
      },
      spec: {
        namespaceSelector: { matchLabels: { team: 'blue' } },
        network: { layer2: { role: 'Secondary', subnets: ['10.0.0.0/24'] }, topology: 'Layer2' },
      },
    };
    let posted = false;
    server.use(
      http.get('*/apis/k8s.ovn.org/v1/clusteruserdefinednetworks', () =>
        HttpResponse.json({
          apiVersion: 'k8s.ovn.org/v1',
          items: [narrowingCUDN],
          kind: 'ClusterUserDefinedNetworkList',
        }),
      ),
      http.post('*/apis/project.openshift.io/v1/projectrequests', async () => {
        posted = true;
        return HttpResponse.json({ kind: 'Project', metadata: { name: PROJECT } }, { status: 201 });
      }),
      http.delete('*/apis/project.openshift.io/v1/projects/*', () =>
        HttpResponse.json({}, { status: 200 }),
      ),
    );
    render(
      <MemoryRouter initialEntries={['/k8s/cluster/projects']}>
        <CreateProjectModal closeModal={() => undefined} onSubmit={() => undefined} />
      </MemoryRouter>,
    );
    await userEvent.type(document.querySelector('#input-name')!, PROJECT);
    await userEvent.click(screen.getByRole('tab', { name: 'Network' }));
    await userEvent.click(document.querySelector('#toggle-network-type')!);
    await userEvent.click(await screen.findByText('Refer an existing ClusterUserDefinedNetwork'));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Select ClusterUserDefinedNetwork' }),
    );
    await userEvent.click(await screen.findByText(CUDN_NAME));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    // Project is created, but patch is rejected and error surfaces via Alert
    await waitFor(() => expect(posted).toBe(true));
    await waitFor(() => expect(screen.getByText(/unsupported/i)).toBeInTheDocument());
  });
});
