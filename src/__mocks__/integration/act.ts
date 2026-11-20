import { act } from '@testing-library/react';

/**
 * Flushes pending promise callbacks inside `act`, so a resource watch that resolves after
 * render or after a click neither warns nor leaks into the next assertion.
 */
export const settle = () => act(async () => {});
