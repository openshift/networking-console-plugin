import { afterAll, afterEach, beforeAll } from '@jest/globals';

import { resetAccessReview } from './dynamic-plugin-sdk';
import { server } from './server';

// An unexpected request means a component hit an endpoint the test did not declare:
// fail loudly instead of rendering an undefined state.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
  resetAccessReview();
});
afterAll(() => server.close());
