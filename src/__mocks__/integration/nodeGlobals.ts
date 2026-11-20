/**
 * jsdom leaves out Node's `setImmediate`/`clearImmediate`, which msw's interceptor schedules
 * request handling with; without them every intercepted request rejects with `fetch failed`
 * caused by `ReferenceError: setImmediate is not defined`.
 */
import { clearImmediate, setImmediate } from 'node:timers';

globalThis.setImmediate = setImmediate;
globalThis.clearImmediate = clearImmediate;
