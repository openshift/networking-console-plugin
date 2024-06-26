import { useFlag } from '@openshift-console/dynamic-plugin-sdk';

/**
 * Hook that returns true if the current user is an admin.
 */
export const useIsAdmin = (): boolean => useFlag('CAN_LIST_NS');
