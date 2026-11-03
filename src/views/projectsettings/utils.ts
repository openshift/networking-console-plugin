import { NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { k8sPatch, K8sResourceCommon, Patch } from '@openshift-console/dynamic-plugin-sdk';
import {
  PROJECT_ALLOW_POD_NETWORK_ANNOTATION,
  PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
  PROJECT_DEFAULT_NETWORK_ANNOTATION,
  PROJECT_POD_NETWORK_VALUE,
} from '@utils/resources/nads/constants';
import { getProjectNetworkSettings, ProjectNetworkSettings } from '@utils/resources/nads/selectors';
import { getAnnotations } from '@utils/resources/shared';

// JSON Patch paths use '/' as a segment separator (RFC 6902). Annotation keys often
// contain '/', so escape '~' → '~0' and '/' → '~1' (e.g. kubevirt.io/allow-pod-network
// → /metadata/annotations/kubevirt.io~1allow-pod-network).
export const patchSafeKey = (key: string): string => key.replace(/~/g, '~0').replace(/\//g, '~1');

const annotationPath = (key: string): string => `/metadata/annotations/${patchSafeKey(key)}`;

export type ProjectNetworkSettingsFormState = {
  allowPodNetwork: boolean;
  preSelectedNetwork: string;
};

export const getDesiredAnnotations = (
  formState: ProjectNetworkSettingsFormState,
): Record<string, string> => {
  const desired: Record<string, string> = {};

  if (!formState.allowPodNetwork) {
    desired[PROJECT_ALLOW_POD_NETWORK_ANNOTATION] = PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE;
  }

  if (formState.preSelectedNetwork && formState.preSelectedNetwork !== PROJECT_POD_NETWORK_VALUE) {
    desired[PROJECT_DEFAULT_NETWORK_ANNOTATION] = formState.preSelectedNetwork;
  }

  return desired;
};

export const buildProjectNetworkSettingsPatches = (
  currentAnnotations: Record<string, string> | undefined,
  desired: Record<string, string>,
): Patch[] => {
  const managedKeys = [PROJECT_ALLOW_POD_NETWORK_ANNOTATION, PROJECT_DEFAULT_NETWORK_ANNOTATION];

  if (!currentAnnotations) {
    if (Object.keys(desired).length === 0) {
      return [];
    }

    // skip json patch test because there is no easy way to check
    // if the annotation key does not exist
    // using revision could lead to false possitives due to unrelated changes
    return [
      {
        op: 'add',
        path: '/metadata/annotations',
        value: desired,
      },
    ];
  }

  const patches: Patch[] = [];

  for (const key of managedKeys) {
    const desiredValue = desired[key];
    const hasAnnotation = Object.prototype.hasOwnProperty.call(currentAnnotations, key);
    const path = annotationPath(key);

    if (desiredValue === undefined) {
      if (hasAnnotation) {
        // Verify the annotation is unchanged before removing it.
        patches.push({
          op: 'test',
          path,
          value: currentAnnotations[key],
        });
        patches.push({
          op: 'remove',
          path,
        });
      }
      continue;
    }

    if (currentAnnotations[key] === desiredValue) {
      continue;
    }

    if (hasAnnotation) {
      // Verify the annotation is unchanged before replacing it.
      patches.push({
        op: 'test',
        path,
        value: currentAnnotations[key],
      });
      patches.push({
        op: 'replace',
        path,
        value: desiredValue,
      });
    } else {
      patches.push({
        op: 'add',
        path,
        value: desiredValue,
      });
    }
  }

  return patches;
};

export const patchProjectNetworkSettings = async (
  projectOrNamespace: K8sResourceCommon,
  formState: ProjectNetworkSettingsFormState,
): Promise<false | ProjectNetworkSettings> => {
  const desired = getDesiredAnnotations(formState);
  const patches = buildProjectNetworkSettingsPatches(getAnnotations(projectOrNamespace), desired);

  if (patches.length === 0) {
    return false;
  }

  const updatedNamespace = await k8sPatch({
    data: patches,
    model: NamespaceModel,
    resource: toNamespaceResource(projectOrNamespace),
  });

  return getProjectNetworkSettings(updatedNamespace);
};

const toNamespaceResource = (namespace: K8sResourceCommon): K8sResourceCommon => {
  return {
    apiVersion: NamespaceModel.apiVersion,
    kind: NamespaceModel.kind,
    metadata: {
      name: namespace.metadata?.name,
    },
  };
};
