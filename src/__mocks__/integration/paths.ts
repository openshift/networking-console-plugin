/**
 * Console-proxy path for a Kubernetes resource list. Mirrors the URL the dynamic plugin SDK
 * builds from a model's API group, version and plural; tests keep the literal values so model
 * drift shows up as a failing assertion.
 */
export const consoleApiPath = (
  apiGroup: string,
  apiVersion: string,
  plural: string,
  namespace?: string,
): string => {
  const root = `*/api/kubernetes${apiGroup ? `/apis/${apiGroup}` : '/api'}/${apiVersion}`;
  return namespace ? `${root}/namespaces/${namespace}/${plural}` : `${root}/${plural}`;
};

/** Wildcard path that matches any namespace for a namespaced collection. */
export const consoleApiNamespacedPath = (
  apiGroup: string,
  apiVersion: string,
  plural: string,
): string => consoleApiPath(apiGroup, apiVersion, plural, ':namespace');

/**
 * Collections every rendered view may watch. Answering them with an empty list keeps an
 * ambient watch from failing the suite, while anything outside this list stays a loud error.
 */
export const BASELINE_COLLECTIONS: readonly (readonly [string, string, string])[] = [
  ['', 'v1', 'namespaces'],
  ['', 'v1', 'configmaps'],
  ['k8s.cni.cncf.io', 'v1', 'network-attachment-definitions'],
  ['authorization.k8s.io', 'v1', 'selfsubjectaccessreviews'],
];
