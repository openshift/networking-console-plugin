import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { BASELINE_COLLECTIONS, consoleApiNamespacedPath, consoleApiPath } from './paths';

const emptyList = { apiVersion: 'v1', items: [], kind: 'List', metadata: {} };

/**
 * MSW server shared by every integration test. Handlers registered through `mockList`
 * (see `./api.ts`) are layered on top per test. The initial handlers survive
 * `server.resetHandlers()`, so every test starts from an empty cluster instead of an
 * unhandled-request error.
 *
 * Namespaced list watches use `:namespace`; named GETs and namespace PATCHes have
 * baseline handlers so ambient watches do not fail the suite.
 */
export const server = setupServer(
  ...BASELINE_COLLECTIONS.flatMap(([apiGroup, apiVersion, plural]) => [
    http.get(consoleApiPath(apiGroup, apiVersion, plural), () => HttpResponse.json(emptyList)),
    http.get(consoleApiNamespacedPath(apiGroup, apiVersion, plural), () =>
      HttpResponse.json(emptyList),
    ),
    http.get(`${consoleApiNamespacedPath(apiGroup, apiVersion, plural)}/:name`, () =>
      HttpResponse.json({
        apiVersion: `${apiGroup ? `${apiGroup}/` : ''}${apiVersion}`,
        kind: 'Unknown',
      }),
    ),
    http.get(`${consoleApiPath(apiGroup, apiVersion, plural)}/:name`, () =>
      HttpResponse.json({
        apiVersion: `${apiGroup ? `${apiGroup}/` : ''}${apiVersion}`,
        kind: 'Unknown',
      }),
    ),
  ]),
  // Access reviews are POSTs; allow them by default so ambient RBAC checks do not fail the suite.
  http.post(
    consoleApiPath('authorization.k8s.io', 'v1', 'selfsubjectaccessreviews'),
    async ({ request }) => {
      const body = (await request.json()) as {
        spec?: { resourceAttributes?: Record<string, string> };
      };
      return HttpResponse.json({
        ...body,
        status: { allowed: true },
      });
    },
  ),
  // Namespace patches succeed with an empty object unless a test overrides the handler.
  http.patch(`${consoleApiPath('', 'v1', 'namespaces')}/:name`, async ({ params, request }) => {
    const patches = await request.json();
    return HttpResponse.json({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: params.name },
      patches,
    });
  }),
);
