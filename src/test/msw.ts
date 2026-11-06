import { setupServer } from 'msw/node';

/* Shared MSW server for integration tests. Scenarios register their recorded
 * responses per test with `server.use(...)`.
 *
 * A request that reaches the server without a handler is recorded here instead
 * of only being logged, and setup.ts fails the test that produced it, so a
 * missing recording cannot pass unnoticed. */
export const server = setupServer();

export const unhandledRequests: string[] = [];
