/* Test-only stand-in for the console SDK internals the plugin imports. */

export const getSegmentAnalytics = (): { analytics: undefined; analyticsEnabled: boolean } => ({
  analytics: undefined,
  analyticsEnabled: false,
});

export const useLastNamespace = (): [string, (next: string) => void] => [
  undefined,
  () => undefined,
];

export const LazyActionMenu = (): null => null;
