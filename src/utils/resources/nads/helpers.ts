import { useEffect, useMemo, useState } from 'react';
import { partition } from 'lodash';

import {
  ConfigMapModel,
  modelToGroupVersionKind,
  NetworkAttachmentDefinitionModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import { IoK8sApiCoreV1ConfigMap } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import {
  checkAccess,
  K8sVerb,
  useAccessReview,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { ImpersonateKind } from '@openshift-console/dynamic-plugin-sdk/lib/app/redux-types';

import { getLabels } from '../shared';

import { MULTUS_DAEMON_CONFIG_NAME, NADRole, OPENSHIFT_MULTUS_NS, UDN_LABEL } from './constants';
import { getNADRole } from './selectors';
import { NetworkAttachmentDefinitionKind } from './types';

export const isUserDefinedNetworkNAD = (nad: NetworkAttachmentDefinitionKind) =>
  Object.keys(nad?.metadata?.labels || {})?.includes(UDN_LABEL);

type FilterUDNNadsResult = {
  primary: NetworkAttachmentDefinitionKind[];
  regular: NetworkAttachmentDefinitionKind[];
};

export const filterUDNNads = (nads: NetworkAttachmentDefinitionKind[]): FilterUDNNadsResult => {
  const [regular, primary] = partition(
    nads,
    (nad) =>
      getNADRole(nad) !== NADRole.Primary &&
      (getLabels(nad)?.[UDN_LABEL] === undefined ||
        getNADRole(nad) === NADRole.Secondary ||
        !getNADRole(nad)),
  ) as [NetworkAttachmentDefinitionKind[], NetworkAttachmentDefinitionKind[]];
  return { primary, regular };
};

const multusDaemonConfigResource = {
  group: ConfigMapModel.apiGroup,
  name: MULTUS_DAEMON_CONFIG_NAME,
  namespace: OPENSHIFT_MULTUS_NS,
  resource: ConfigMapModel.plural,
  verb: 'get' as K8sVerb,
};

const multusDaemonConfigWatchResource = {
  groupVersionKind: modelToGroupVersionKind(ConfigMapModel),
  isList: false,
  name: MULTUS_DAEMON_CONFIG_NAME,
  namespace: OPENSHIFT_MULTUS_NS,
  namespaced: true,
};

const EMPTY_ARRAY: string[] = [];

export const useGlobalNamespaces = (impersonate?: ImpersonateKind): [string[], boolean] => {
  const [canGetMultusDaemonConfig, isLoadingMultusDaemonConfig] = useAccessReview(
    multusDaemonConfigResource,
    impersonate,
  );

  const [configMap, loaded] = useK8sWatchResource<IoK8sApiCoreV1ConfigMap>(
    canGetMultusDaemonConfig && !isLoadingMultusDaemonConfig
      ? multusDaemonConfigWatchResource
      : null,
  );

  const daemonConfig = configMap?.data?.['daemon-config.json'] ?? '';
  const globalNamespaces = useMemo(() => parseGlobalNamespaces(daemonConfig), [daemonConfig]);

  const [allowedNamespaces, isLoadingAllowedNamespaces] = useNadAccessReview(
    globalNamespaces,
    impersonate,
  );

  return [allowedNamespaces, isLoadingMultusDaemonConfig || !loaded || isLoadingAllowedNamespaces];
};

/** Parses Multus `daemon-config.json` `globalNamespaces` into a trimmed namespace list. */
export const parseGlobalNamespaces = (daemonConfig: string): string[] => {
  if (!daemonConfig) return EMPTY_ARRAY;
  try {
    const value = (JSON.parse(daemonConfig) as { globalNamespaces?: unknown }).globalNamespaces;
    return typeof value === 'string'
      ? value
          .split(',')
          .map((ns) => ns.trim())
          .filter(Boolean)
      : EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
};

const resourceTemplate = {
  group: NetworkAttachmentDefinitionModel.apiGroup,
  resource: NetworkAttachmentDefinitionModel.plural,
  verb: 'list' as K8sVerb,
};

const useNadAccessReview = (
  namespaces: string[],
  impersonate?: ImpersonateKind,
): [string[], boolean] => {
  const [loading, setLoading] = useState(true);
  const [allowedNamespaces, setAllowedNamespaces] = useState<string[]>([]);

  useEffect(() => {
    if (namespaces.length === 0) {
      setAllowedNamespaces([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchReviews = async (targetNamespaces: string[], targetImpersonate?: ImpersonateKind) =>
      Promise.allSettled(
        targetNamespaces.map((namespace) =>
          checkAccess(
            {
              ...resourceTemplate,
              namespace,
            },
            targetImpersonate,
          ),
        ),
      )
        .then((results) => {
          // cancel also on namespaces or impersonate change
          if (cancelled || targetNamespaces !== namespaces || targetImpersonate !== impersonate)
            return;
          const allowed = results
            .map(
              (result) =>
                result.status === 'fulfilled' &&
                result.value?.status?.allowed &&
                result.value?.spec?.resourceAttributes?.namespace,
            )
            .filter(Boolean);
          setAllowedNamespaces(allowed as string[]);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled || targetNamespaces !== namespaces || targetImpersonate !== impersonate)
            return;
          // eslint-disable-next-line no-console
          console.warn('SelfSubjectAccessReview failed', e);
          // Default to enabling the action if the access review fails so that we
          // don't incorrectly block users from actions they can perform. The server
          // still enforces access control.
          setAllowedNamespaces([]);
          setLoading(false);
        });

    fetchReviews(namespaces, impersonate);

    return () => {
      cancelled = true;
    };
  }, [namespaces, impersonate]);

  // Avoid mutating state with .sort(), and avoid ''.split(',') === [''].
  const allowedKey = [...allowedNamespaces].filter(Boolean).sort().join(',');
  const stableAllowedNamespaces = useMemo(
    () => (allowedKey ? allowedKey.split(',') : EMPTY_ARRAY),
    [allowedKey],
  );

  return [stableAllowedNamespaces, loading];
};
