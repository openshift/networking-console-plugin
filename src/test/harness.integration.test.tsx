import * as React from 'react';
import { http, HttpResponse } from 'msw';

import { expect, it } from '@jest/globals';
import { type K8sResourceCommon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';

import { Operator, resourcePath } from './console-sdk-shim';
import { loadListFixture } from './fixtures';
import { server } from './msw';

const PodList = () => {
  const [pods, loaded] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: { kind: 'Pod', version: 'v1' },
    isList: true,
    namespace: 'cy-test-ns',
  });

  if (!loaded) return <div>loading</div>;

  return <div data-testid="pod-names">{pods?.map((pod) => pod.metadata?.name).join(',')}</div>;
};

it('serves a recorded list through the SDK shim and MSW', async () => {
  const pods = loadListFixture<K8sResourceCommon>('pods');

  server.use(
    http.get('*/api/v1/namespaces/cy-test-ns/pods', () =>
      HttpResponse.json({ apiVersion: 'v1', items: pods, kind: 'PodList' }),
    ),
  );

  render(<PodList />);

  expect(await screen.findByTestId('pod-names')).toHaveTextContent('other-1,web-1,web-2');
});

it('resolves the plugin model plurals registered by setup', () => {
  expect(
    resourcePath({
      groupVersionKind: {
        group: 'k8s.cni.cncf.io',
        kind: 'MultiNetworkPolicy',
        version: 'v1beta1',
      },
      isList: true,
      namespace: 'cy-test-ns',
    }),
  ).toBe('/apis/k8s.cni.cncf.io/v1beta1/namespaces/cy-test-ns/multi-networkpolicies');
});

it('exposes the SDK operator enum as a runtime value', () => {
  expect(Operator.Equals).toBe('Equals');
});
