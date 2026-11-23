import { http, HttpResponse, JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';

/* Shared MSW server for integration tests. Scenarios register their recorded
 * responses per test with `server.use(...)`.
 *
 * A request that reaches the server without a handler is recorded here instead
 * of only being logged, and setup.ts fails the test that produced it, so a
 * missing recording cannot pass unnoticed. */
export const server = setupServer();

export const unhandledRequests: string[] = [];

/** Serves a Kubernetes list payload for a path pattern. */
export const mockList = (path: string, items: unknown[]): void => {
  server.use(
    http.get(path, () =>
      HttpResponse.json({ apiVersion: 'v1', items, kind: 'List', metadata: {} }),
    ),
  );
};

/** Serves a single Kubernetes object for a GET. */
export const mockGet = (path: string, body: JsonBodyType): void => {
  server.use(http.get(path, () => HttpResponse.json(body)));
};
