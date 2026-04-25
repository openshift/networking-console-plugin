import {
  AccessReviewResourceAttributes,
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceCommon,
  K8sResourceKindReference,
  K8sVerb,
} from '@openshift-console/dynamic-plugin-sdk';
import { ALL_NAMESPACES, CLUSTER, CORE, DEFAULT_NAMESPACE } from '@utils/constants';
import { getValidNamespace } from '@utils/utils';

/**
 *
 * @param resource k8s resource
 * @returns resource's name
 */
export const getName = <A extends K8sResourceCommon = K8sResourceCommon>(resource: A) =>
  resource?.metadata?.name;

/**
 *
 * @param resource k8s resource
 * @returns resource's namespace
 */
export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(resource: A) =>
  resource?.metadata?.namespace;

/**
 * function to build AccessReviewResourceAttributes from a resource
 * @param model - k8s model
 * @param obj - resource
 * @param verb - verb
 * @param subresource - subresource
 * @returns AccessReviewResourceAttributes
 */
export const asAccessReview = (
  model: K8sModel,
  obj: K8sResourceCommon,
  verb: K8sVerb,
  subresource?: string,
): AccessReviewResourceAttributes => {
  if (!obj) {
    return null;
  }
  return {
    group: model.apiGroup,
    name: obj?.metadata?.name,
    namespace: obj?.metadata?.namespace,
    resource: model.plural,
    subresource,
    verb,
  };
};

/**
 * Get creation timestamp
 * @param resource - resource from which to retrieve creation timestamp
 * @returns Date - creation timestamp as a Date object
 */
export const getCreationTimestamp = <A extends K8sResourceCommon = K8sResourceCommon>(
  resource: A,
) => new Date(resource?.metadata?.creationTimestamp).toString();

/**
 * Get annotations
 * @param resource - resource from which to retrieve annotations
 * @param defaultValue - value to return if there are no annotations
 * @returns { [key: string]: string } - annotations
 */
export const getAnnotations = <A extends K8sResourceCommon = K8sResourceCommon>(
  resource: A,
  defaultValue?: {
    [key: string]: string;
  },
): { [key: string]: string } => resource?.metadata?.annotations || defaultValue;

/**
 * Get labels
 * @param resource - resource from which to retrieve labels
 * @param defaultValue - value to return if there are no annotations
 * @returns { [key: string]: string } - labels
 */
export const getLabels = <A extends K8sResourceCommon = K8sResourceCommon>(
  resource: A,
  defaultValue?: { [key: string]: string },
): { [key: string]: string } => resource?.metadata?.labels || defaultValue;

/**
 * Get UID
 * @param resource - resource from which to retrieve UID
 * @returns string - UID
 */
export const getUID = <A extends K8sResourceCommon = K8sResourceCommon>(resource: A): string =>
  resource?.metadata?.uid;

type ResourceUrlProps = {
  activeNamespace?: string;
  model: K8sModel;
  path?: string;
  resource?: K8sResourceCommon;
};

/**
 * function for getting a resource URL
 * @param {ResourceUrlProps} urlProps - object with model, resource to get the URL from (optional) and active namespace/project name (optional)
 * @returns {string} the URL for the resource
 */
export const getResourceURL = (urlProps: ResourceUrlProps): string => {
  const { activeNamespace, model, path, resource } = urlProps;

  if (!model) return null;
  const { crd, namespaced, plural } = model;

  const namespace = resource?.metadata?.namespace || getValidNamespace(activeNamespace);
  const namespaceURL = namespace ? `ns/${namespace}` : ALL_NAMESPACES;
  const ref = crd ? `${model.apiGroup || CORE}~${model.apiVersion}~${model.kind}` : plural || '';
  const name = resource?.metadata?.name || '';

  let url = `/k8s/${namespaced ? namespaceURL : CLUSTER}`;

  if (ref) url += `/${ref}`;
  if (name) url += `/${name}`;
  if (path) url += `/${path}`;

  return url;
};

export const resourcePathFromModel = (
  model: K8sModel,
  name?: string,
  namespace = DEFAULT_NAMESPACE,
) => {
  const { namespaced } = model;

  let url = '/k8s/';

  if (!namespaced) {
    url += 'cluster/';
  }

  if (namespaced) {
    url += namespace ? `ns/${namespace}/` : 'all-namespaces/';
  }

  url += `${model.apiGroup || CORE}~${model.apiVersion}~${model.kind}`;

  if (name) {
    // Some resources have a name that needs to be encoded. For instance,
    // Users can have special characters in the name like `#`.
    url += `/${encodeURIComponent(name)}`;
  }

  return url;
};

export const getReference = ({
  group,
  kind,
  version,
}: K8sGroupVersionKind): K8sResourceKindReference => [group || 'core', version, kind].join('~');

export const getReferenceForModel = (model: K8sModel): K8sResourceKindReference =>
  getReference({ group: model.apiGroup, kind: model.kind, version: model.apiVersion });
