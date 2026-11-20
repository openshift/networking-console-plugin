import React, { useEffect, useState } from 'react';

import {
  ConfigMapModel,
  NamespaceModel,
  NetworkAttachmentDefinitionModel,
} from '@kubevirt-ui-ext/kubevirt-api/console';

/**
 * Test double for the dynamic plugin SDK data layer.
 *
 * The console resolves a `groupVersionKind` to a model and issues a request to the
 * console proxy (`/api/kubernetes/...`). This double does the same, but through
 * `fetch`, so MSW owns the responses: integration tests exercise the real component
 * tree against realistic Kubernetes payloads instead of mocked hooks.
 */
type GroupVersionKind = { group?: string; kind: string; version: string };

type WatchResourceArgs = {
  groupVersionKind: GroupVersionKind;
  isList?: boolean;
  name?: string;
  namespace?: string;
  namespaced?: boolean;
} | null;

type AccessReviewResourceAttributes = {
  group?: string;
  name?: string;
  namespace?: string;
  resource?: string;
  subresource?: string;
  verb?: string;
};

type K8sModel = {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
  namespaced?: boolean;
  plural: string;
};

// Plural comes from the plugin's models — the same source the SDK's model registry uses.
const PLURALS = new Map(
  [NamespaceModel, ConfigMapModel, NetworkAttachmentDefinitionModel].map((model) => [
    `${model.apiGroup ?? ''}/${model.apiVersion}/${model.kind}`,
    { namespaced: Boolean(model.namespaced), plural: model.plural },
  ]),
);

const resolveModel = ({
  group = '',
  kind,
  version,
}: GroupVersionKind): { namespaced: boolean; plural: string } =>
  PLURALS.get(`${group}/${version}/${kind}`) ?? {
    namespaced: false,
    plural: `${kind.toLowerCase()}s`,
  };

export const consoleApiPathFor = (
  { group = '', kind, version }: GroupVersionKind,
  { name, namespace, namespaced }: { name?: string; namespace?: string; namespaced?: boolean } = {},
): string => {
  const model = resolveModel({ group, kind, version });
  const useNs = Boolean(namespace) && (namespaced ?? model.namespaced);
  const root = `${group ? `/apis/${group}` : '/api'}/${version}`;
  const collection = useNs
    ? `${root}/namespaces/${namespace}/${model.plural}`
    : `${root}/${model.plural}`;
  return name ? `${collection}/${name}` : collection;
};

export const getGroupVersionKindForResource = (resource?: {
  apiVersion?: string;
  kind?: string;
}): GroupVersionKind | undefined => {
  const apiVersion = resource?.apiVersion;
  const kind = resource?.kind;
  const [group, version] = apiVersion?.split('/') ?? [];
  if (!apiVersion || !kind) {
    return undefined;
  }
  return version ? { group, kind, version } : { kind, version: apiVersion };
};

export const useK8sWatchResource = <T,>(
  args: WatchResourceArgs,
): [T | undefined, boolean, Error | undefined] => {
  const path = args
    ? consoleApiPathFor(args.groupVersionKind, {
        name: args.name,
        namespace: args.namespace,
        namespaced: args.namespaced,
      })
    : null;
  const isList = Boolean(args?.isList);
  const [state, setState] = useState<[T | undefined, boolean, Error | undefined]>([
    isList ? ([] as T) : ({} as T),
    // A null watch is already "loaded" with empty data — matching the real SDK skip path.
    !args,
    undefined,
  ]);

  useEffect(() => {
    if (!path || !args) {
      setState([isList ? ([] as T) : ({} as T), true, undefined]);
      return undefined;
    }

    let active = true;
    const emptyData = isList ? ([] as T) : ({} as T);

    setState([emptyData, false, undefined]);
    fetch(`${window.location.origin}/api/kubernetes${path}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Console API ${response.status} for ${path}`);
        }
        return response.json();
      })
      .then((body) => {
        if (active) {
          setState([(isList ? body.items : body) as T, true, undefined]);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setState([emptyData, true, error]);
        }
      });

    return () => {
      active = false;
    };
  }, [args, isList, path]);

  return state;
};

type WatchK8sResult = { data: unknown; loaded: boolean; loadError: Error | undefined };

export const useK8sWatchResources = (
  resources: Record<string, Exclude<WatchResourceArgs, null>>,
): Record<string, WatchK8sResult> => {
  const key = Object.keys(resources)
    .sort()
    .map(
      (id) =>
        `${id}:${consoleApiPathFor(resources[id].groupVersionKind, {
          name: resources[id].name,
          namespace: resources[id].namespace,
          namespaced: resources[id].namespaced,
        })}`,
    )
    .join('|');
  const [state, setState] = useState<Record<string, WatchK8sResult>>({});

  useEffect(() => {
    let active = true;
    const entries = Object.entries(resources);
    setState(
      Object.fromEntries(
        entries.map(([id, args]) => [
          id,
          { data: args.isList ? [] : {}, loaded: false, loadError: undefined },
        ]),
      ),
    );

    Promise.all(
      entries.map(async ([id, args]) => {
        const path = consoleApiPathFor(args.groupVersionKind, {
          name: args.name,
          namespace: args.namespace,
          namespaced: args.namespaced,
        });
        try {
          const response = await fetch(`${window.location.origin}/api/kubernetes${path}`);
          if (!response.ok) {
            throw new Error(`Console API ${response.status} for ${path}`);
          }
          const body = await response.json();
          return [
            id,
            {
              data: (args.isList ? body.items : body) as unknown,
              loaded: true,
              loadError: undefined,
            },
          ] as const;
        } catch (error) {
          return [
            id,
            {
              data: args.isList ? [] : {},
              loaded: true,
              loadError: error as Error,
            },
          ] as const;
        }
      }),
    ).then((results) => {
      if (active) {
        setState(Object.fromEntries(results));
      }
    });

    return () => {
      active = false;
    };
    // `resources` is rebuilt each render; the path key is the stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
};

type ImpersonateKind = {
  groups?: string[];
  kind: string;
  name: string;
  subprotocols: string[];
};

const impersonateKey = (impersonate?: ImpersonateKind | null): string =>
  impersonate ? `${impersonate.kind}~${impersonate.name}` : '';

const accessKey = (
  attrs?: AccessReviewResourceAttributes | null,
  impersonate?: ImpersonateKind | null,
): string => {
  if (!attrs) return `${impersonateKey(impersonate)}|*`;
  return [
    impersonateKey(impersonate),
    attrs.group,
    attrs.resource,
    attrs.verb,
    attrs.namespace,
    attrs.name,
  ]
    .map((part) => part ?? '')
    .join('|');
};

let defaultAccess: [boolean, boolean] = [true, false];
const accessOverrides = new Map<string, [boolean, boolean]>();

const resolveAccess = (
  attrs?: AccessReviewResourceAttributes | null,
  impersonate?: ImpersonateKind | null,
): [boolean, boolean] =>
  // Prefer an impersonation-specific override, then a generic one, then the suite default.
  accessOverrides.get(accessKey(attrs, impersonate)) ??
  (impersonate ? accessOverrides.get(accessKey(attrs)) : undefined) ??
  defaultAccess;

/** Tests can flip RBAC without re-mocking the whole SDK module. */
export const setAccessReview = (
  value: [boolean, boolean],
  attrs?: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
): void => {
  if (!attrs) {
    defaultAccess = value;
    return;
  }
  accessOverrides.set(accessKey(attrs, impersonate), value);
};

export const resetAccessReview = (): void => {
  defaultAccess = [true, false];
  accessOverrides.clear();
};

export const useAccessReview = (
  attrs?: AccessReviewResourceAttributes | null,
  impersonate?: ImpersonateKind | null,
): [boolean, boolean] => resolveAccess(attrs, impersonate);

export const checkAccess = async (
  attrs: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind | null,
): Promise<{
  spec: { resourceAttributes: AccessReviewResourceAttributes };
  status: { allowed: boolean };
}> => {
  const [allowed] = resolveAccess(attrs, impersonate);
  return {
    spec: { resourceAttributes: attrs },
    status: { allowed },
  };
};

const consoleUrlFor = (
  model: K8sModel,
  resource?: { metadata?: { name?: string; namespace?: string } },
) => {
  const name = resource?.metadata?.name;
  const namespace = resource?.metadata?.namespace;
  const root = `${window.location.origin}/api/kubernetes${
    model.apiGroup ? `/apis/${model.apiGroup}` : '/api'
  }/${model.apiVersion}`;
  const collection =
    model.namespaced && namespace
      ? `${root}/namespaces/${namespace}/${model.plural}`
      : `${root}/${model.plural}`;
  return name ? `${collection}/${name}` : collection;
};

const request = async (method: string, url: string, data?: unknown) => {
  const response = await fetch(url, {
    body: data === undefined ? undefined : JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    method,
  });
  if (!response.ok) {
    throw new Error(`Console API ${response.status} for ${method} ${url}`);
  }
  return response.json();
};

export const k8sPatch = async ({
  data,
  model,
  resource,
}: {
  data: unknown;
  model: K8sModel;
  resource: { metadata?: { name?: string; namespace?: string } };
}) => request('PATCH', consoleUrlFor(model, resource), data);

export const k8sCreate = async ({ data, model }: { data: unknown; model: K8sModel }) =>
  request('POST', consoleUrlFor(model, data as { metadata?: { namespace?: string } }), data);

/** Runtime enum imported by label helpers; values match the console SDK. */
export enum Operator {
  DoesNotExist = 'DoesNotExist',
  Equals = 'Equals',
  Exists = 'Exists',
  GreaterThan = 'GreaterThan',
  In = 'In',
  LessThan = 'LessThan',
  NotEqual = 'NotEqual',
  NotEquals = 'NotEquals',
  NotIn = 'NotIn',
}

export const ResourceIcon = () => <span aria-hidden="true" />;

export const ResourceLink = ({ name }: { name: string }) => <span>{name}</span>;

export const Timestamp = ({ timestamp }: { timestamp?: string }) => <span>{timestamp}</span>;
