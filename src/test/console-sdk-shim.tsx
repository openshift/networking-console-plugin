/* Test-only stand-in for the console SDK.
 *
 * The real SDK is provided by the console at runtime and talks to the console
 * proxy. Here the data hooks are implemented over `fetch`, so MSW can serve
 * fixture payloads, and the production components and hooks under test run
 * unchanged.
 */

import * as React from 'react';
import { Link } from 'react-router';

import * as consoleModels from '@kubevirt-ui-ext/kubevirt-api/console';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

type GroupVersionKind = { group?: string; kind: string; version: string };

export type WatchK8sResource = {
  groupVersionKind?: GroupVersionKind;
  isList?: boolean;
  name?: string;
  namespace?: string;
  optional?: boolean;
  selector?: Record<string, string>;
};

/* Kinds whose plural is not just the lower-cased kind; the model registry is the
 * source of truth, so collect it once instead of guessing. */
type ModelLike = { kind?: string; plural?: string };

const MODEL_PLURALS: Record<string, string> = {};

/* Exported so setup.ts can register the plugin's own models before the first
 * test body; the kubevirt models are registered below. */
export const registerK8sModels = (source: Record<string, unknown>): void => {
  for (const candidate of Object.values(source)) {
    const model = candidate as ModelLike;

    if (
      model &&
      typeof model === 'object' &&
      typeof model.kind === 'string' &&
      typeof model.plural === 'string'
    ) {
      MODEL_PLURALS[model.kind] = model.plural;
    }
  }
};

registerK8sModels(consoleModels as Record<string, unknown>);

const IRREGULAR_PLURALS: Record<string, string> = {
  Endpoints: 'endpoints',
  Ingress: 'ingresses',
  NetworkPolicy: 'networkpolicies',
  Policy: 'policies',
};

const pluralFor = (kind: string): string =>
  MODEL_PLURALS[kind] ?? IRREGULAR_PLURALS[kind] ?? `${kind.toLowerCase()}s`;

export const resourcePath = ({
  groupVersionKind,
  isList,
  name,
  namespace,
}: WatchK8sResource): string => {
  if (!groupVersionKind) {
    throw new Error('resourcePath: groupVersionKind is required');
  }

  const { group, kind, version } = groupVersionKind;
  const prefix = group ? `/apis/${group}/${version}` : `/api/${version}`;
  const plural = pluralFor(kind);

  if (isList) {
    return namespace ? `${prefix}/namespaces/${namespace}/${plural}` : `${prefix}/${plural}`;
  }

  if (!name) {
    throw new Error('resourcePath: name is required for a single resource');
  }

  return namespace
    ? `${prefix}/namespaces/${namespace}/${plural}/${name}`
    : `${prefix}/${plural}/${name}`;
};

const listItems = <T,>(json: unknown): T[] => {
  if (json && typeof json === 'object' && 'items' in json && Array.isArray(json.items)) {
    return json.items;
  }

  return [];
};

const selectorQuery = (selector?: Record<string, string>): string =>
  selector && Object.keys(selector).length > 0
    ? `?labelSelector=${encodeURIComponent(
        Object.entries(selector)
          .map(([key, value]) => `${key}=${value}`)
          .join(','),
      )}`
    : '';

const fetchJson = async (path: string, selector?: Record<string, string>): Promise<unknown> => {
  const url = new URL(`${path}${selectorQuery(selector)}`, window.location.origin).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${path}`);
  }

  return response.json();
};

type WatchResult<T> = [data: T | undefined, loaded: boolean, error: Error | undefined];

const useWatch = <T,>(resource: null | WatchK8sResource): WatchResult<T> => {
  const path = React.useMemo(() => (resource ? resourcePath(resource) : null), [resource]);
  // Callers build the selector inline on every render, so the effect keys on its
  // contents; keying on the object would refetch on each render.
  const selectorSignature = JSON.stringify(resource?.selector ?? null);
  const [state, setState] = React.useState<{
    data?: T;
    error?: Error;
    loaded: boolean;
  }>({ loaded: !resource });

  React.useEffect(() => {
    if (!resource || !path) {
      setState({ data: undefined, loaded: true });
      return;
    }

    let active = true;

    fetchJson(path, resource.selector)
      .then((json) => {
        if (!active) return;

        const payload = resource.isList ? listItems<T>(json) : json;
        // Recorded fixtures are the contract for these scenarios; the shim trusts
        // the recorded payload to match the watched kind.
        const resourceData = payload as T;
        setState({ data: resourceData, loaded: true });
      })
      .catch((error: Error) => {
        if (!active) return;
        setState({ error, loaded: true });
      });

    return () => {
      active = false;
    };
    // The resource object is recreated by callers on every render; the resolved
    // path and the watched fields (by contents, not identity) are the inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, resource?.isList, selectorSignature]);

  return [state.data, state.loaded, state.error];
};

export const useK8sWatchResource = <T,>(resource: null | WatchK8sResource): WatchResult<T> =>
  useWatch<T>(resource);

type WatchResourcesResult<T> = {
  [K in keyof T]: { data: unknown; loaded: boolean; loadError: Error | undefined };
};

/* `useK8sWatchResources` returns objects per key, unlike the tuple returned by the
 * single-resource hook. */
export const useK8sWatchResources = <T extends Record<string, WatchK8sResource>>(
  resources: T,
): WatchResourcesResult<T> => {
  const entries = Object.entries(resources) as Array<[keyof T & string, WatchK8sResource]>;
  // A hook cannot loop, so every watched resource is fetched in one effect keyed
  // by the resolved paths.
  const signature = JSON.stringify(
    entries.map(([name, resource]) => [
      name,
      resourcePath(resource),
      Boolean(resource.isList),
      resource.selector ?? null,
    ]),
  );

  const [state, setState] = React.useState<
    Record<string, { data: unknown; loaded: boolean; loadError: Error | undefined }>
  >(() =>
    Object.fromEntries(
      entries.map(([name]) => [name, { data: undefined, loaded: false, loadError: undefined }]),
    ),
  );

  React.useEffect(() => {
    let active = true;

    Promise.all(
      entries.map(async ([name, resource]) => {
        try {
          const json = await fetchJson(resourcePath(resource), resource.selector);
          const data = resource.isList ? listItems(json) : json;
          return [name, { data, loaded: true, loadError: undefined }] as const;
        } catch (error) {
          return [name, { data: undefined, loaded: true, loadError: error as Error }] as const;
        }
      }),
    ).then((pairs) => {
      if (active) setState(Object.fromEntries(pairs));
    });

    return () => {
      active = false;
    };
    // `entries` is intentionally represented by `signature`: the object identity
    // changes every render, which would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return state as WatchResourcesResult<T>;
};

/* Label-selector operators, as the console exports them. Not a const enum: the
 * transpile-only transform erases those, leaving no export for ESM to link. */
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

/* Returns a tuple like the SDK; components destructure it as
 * `[activeNamespace]`. Tests default to the fixture namespace so scoped hooks
 * request the paths the handlers serve. */
export const useActiveNamespace = (): [string, (namespace: string) => void] => [
  'cy-test-ns',
  () => undefined,
];

export const useActivePerspective = (): [string, (next: string) => void] => [
  'admin',
  () => undefined,
];

export const useResolvedExtensions = <T,>(): [T[], boolean, unknown[]] => [[], true, []];

type K8sModelLike = {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
  namespaced?: boolean;
  plural: string;
};

const collectionPath = (model: K8sModelLike, namespace?: string): string => {
  const prefix = model.apiGroup
    ? `/apis/${model.apiGroup}/${model.apiVersion}`
    : `/api/${model.apiVersion}`;
  const base = namespace ? `${prefix}/namespaces/${namespace}` : prefix;

  return `${base}/${model.plural}`;
};

/* Writes go through fetch so MSW can assert the exact payload the plugin sends,
 * which is the point of the form and action scenarios. */
const send = async (
  method: string,
  path: string,
  body?: unknown,
  contentType = 'application/json',
): Promise<unknown> => {
  const url = new URL(path, window.location.origin).toString();
  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { Accept: 'application/json', 'Content-Type': contentType },
    method,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${method} ${path}`);
  }

  return response.status === 204 ? undefined : response.json();
};

type ResourceLike = { metadata?: { name?: string; namespace?: string } };

export const k8sGet = async ({
  model,
  name,
  ns,
}: {
  model: K8sModelLike;
  name: string;
  ns?: string;
}) => send('GET', `${collectionPath(model, ns)}/${name}`);

export const k8sCreate = async ({ data, model }: { data: ResourceLike; model: K8sModelLike }) =>
  send('POST', collectionPath(model, data?.metadata?.namespace), data);

export const k8sUpdate = async ({
  data,
  model,
  ns,
}: {
  data: ResourceLike;
  model: K8sModelLike;
  ns?: string;
}) =>
  send(
    'PUT',
    `${collectionPath(model, ns ?? data?.metadata?.namespace)}/${data?.metadata?.name}`,
    data,
  );

export const k8sPatch = async ({
  data,
  model,
  resource,
}: {
  data: unknown;
  model: K8sModelLike;
  resource: ResourceLike;
}) =>
  send(
    'PATCH',
    `${collectionPath(model, resource?.metadata?.namespace)}/${resource?.metadata?.name}`,
    data,
    'application/json-patch+json',
  );

export const k8sDelete = async ({
  model,
  resource,
}: {
  model: K8sModelLike;
  resource: ResourceLike;
}) =>
  send(
    'DELETE',
    `${collectionPath(model, resource?.metadata?.namespace)}/${resource?.metadata?.name}`,
  );

/* Row and action primitives. The plugin's lists render rows through these, and
 * its action hooks build declarative Action objects rather than calling the API,
 * so a light stand-in is enough to assert what the plugin decides. */
const resourceDetailPath = (gvk: GroupVersionKind, name: string, namespace?: string): string => {
  const resource = `${gvk.group || 'core'}~${gvk.version}~${gvk.kind}`;

  return namespace
    ? `/k8s/ns/${namespace}/${resource}/${name}`
    : `/k8s/cluster/${resource}/${name}`;
};

export const ResourceLink = ({
  groupVersionKind,
  kind,
  name,
  namespace,
}: {
  groupVersionKind?: GroupVersionKind;
  inline?: boolean;
  kind?: string;
  name: string;
  namespace?: null | string;
  title?: string;
}) => {
  const gvk =
    groupVersionKind ?? (kind ? { kind, version: 'v1' } : { kind: 'Namespace', version: 'v1' });

  return (
    <Link
      data-testid={`resource-link-${name}`}
      to={resourceDetailPath(gvk, name, namespace ?? undefined)}
    >
      {name}
    </Link>
  );
};

export const TableData = ({ children, id }: { children?: React.ReactNode; id?: string }) => (
  <td data-column={id}>{children}</td>
);

export const getGroupVersionKindForResource = (
  resource: { apiVersion?: string; kind?: string } | undefined,
) => {
  const [group, version] = (resource?.apiVersion ?? 'v1').split('/');
  return {
    group: version ? group : undefined,
    kind: resource?.kind ?? '',
    version: version ?? group,
  };
};

export const getGroupVersionKindForModel = (model: {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
}) => ({ group: model.apiGroup, kind: model.kind, version: model.apiVersion });

export const useK8sModel = (reference: unknown): [unknown, boolean] => [reference, true];
export const useK8sModels = (): [Record<string, unknown>, boolean] => [
  {
    'hco.kubevirt.io~v1~HyperConverged': consoleModels.HyperConvergedModel,
    'sriovnetwork.openshift.io~v1~SriovNetworkNodePolicy':
      consoleModels.SriovNetworkNodePolicyModel,
  },
  true,
];
export const useAccessReview = (): [boolean, boolean] => [true, true];
export const useDeleteModal = (): (() => void) => () => undefined;
export const useLabelsModal = (): (() => void) => () => undefined;
export const useAnnotationsModal = (): (() => void) => () => undefined;

/* List page shell. Enough of the console's list contract for a page to render
 * and filter: the header, the create button, a search box wired to the page's
 * filter callback, and a table that renders each row through the page's Row. */
export const ListPageHeader = ({
  children,
  title,
}: {
  children?: React.ReactNode;
  title?: string;
}) => (
  <div data-testid="list-page-header">
    {title ? <h1>{title}</h1> : null}
    {children}
  </div>
);

export const ListPageBody = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="list-page-body">{children}</div>
);

export const ListPageCreateButton = ({
  children,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  createAccessReview?: unknown;
  onClick?: () => void;
}) => (
  <button onClick={onClick} type="button">
    {children}
  </button>
);

export const ListPageCreateDropdown = ({
  children,
  items,
  onClick,
}: {
  children?: React.ReactNode;
  createAccessReview?: unknown;
  items?: Record<string, string>;
  onClick?: (item: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen((open) => !open)} type="button">
        {children}
      </button>
      {isOpen
        ? Object.entries(items ?? {}).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setIsOpen(false);
                onClick?.(key);
              }}
              type="button"
            >
              {label}
            </button>
          ))
        : null}
    </div>
  );
};

export const NamespaceBar = () => <div data-testid="namespace-bar" />;

export const HorizontalNav = ({
  pages = [],
  resource,
}: {
  pages?: Array<{
    component: React.ComponentType<{ obj?: unknown }>;
    href?: string;
    name?: React.ReactNode;
  }>;
  resource?: unknown;
}) => {
  const [activeHref, setActiveHref] = React.useState(pages[0]?.href ?? '');
  const activePage = pages.find((page) => page.href === activeHref) ?? pages[0];

  return (
    <div>
      <nav aria-label="Details tabs">
        {pages.map((page) => (
          <button
            aria-pressed={page.href === activePage?.href}
            key={page.href}
            onClick={() => setActiveHref(page.href ?? '')}
            role="tab"
            type="button"
          >
            {page.name}
          </button>
        ))}
      </nav>
      {activePage?.component ? <activePage.component obj={resource} /> : null}
    </div>
  );
};

export const ListPageFilter = ({
  loaded,
  onFilterChange,
}: {
  data?: unknown;
  loaded?: boolean;
  onFilterChange?: (filters: unknown, text: string) => void;
}) => (
  <input
    aria-label="filter"
    disabled={!loaded}
    onChange={(event) => onFilterChange?.(null, event.target.value)}
  />
);

type FilterableItem = { metadata?: { labels?: Record<string, string>; name?: string } };

export const useListPageFilter = <T,>(
  data: T[] = [],
): [T[], T[], (f: unknown, text: string) => void] => {
  const [text, setText] = React.useState('');

  const filteredData = React.useMemo(() => {
    if (!text) return data;

    const needle = text.toLowerCase();

    return data.filter((item) => {
      const resource = item as FilterableItem;
      const labels = Object.entries(resource.metadata?.labels ?? {})
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

      return `${resource.metadata?.name ?? ''} ${labels}`.toLowerCase().includes(needle);
    });
  }, [data, text]);

  const onFilterChange = React.useCallback(
    (_filters: unknown, next: string) => setText(next ?? ''),
    [],
  );

  return [data, filteredData, onFilterChange];
};

export const VirtualizedTable = <T,>({
  columns,
  data,
  EmptyMsg,
  loaded,
  loadError,
  Row,
  rowData,
}: {
  columns?: Array<{ id?: string }>;
  data?: T[];
  EmptyMsg?: () => React.ReactNode;
  loaded?: boolean;
  loadError?: unknown;
  Row?: React.ComponentType<{
    activeColumnIDs: Set<string>;
    index: number;
    obj: T;
    rowData: unknown;
  }>;
  rowData?: unknown;
  unfilteredData?: T[];
}) => {
  if (!loaded) return <div>loading</div>;
  if (loadError) return <div data-testid="load-error">error</div>;
  if (!data?.length) return <>{EmptyMsg ? <EmptyMsg /> : <div>empty</div>}</>;

  const activeColumnIDs = new Set((columns ?? []).map((column) => column.id));

  return (
    <table>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {Row ? (
              <Row
                activeColumnIDs={activeColumnIDs}
                index={index}
                obj={item}
                rowData={rowData ?? {}}
              />
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const ResourceYAMLEditor = ({ initialResource }: { initialResource?: unknown }) => (
  <pre data-testid="yaml-editor">{JSON.stringify(initialResource ?? null)}</pre>
);

/* Column management: the table stand-in renders every column it is given. */
export const useActiveColumns = <T,>({
  columns = [],
}: {
  columnManagementID?: string;
  columns?: T[];
}): [T[], (columns: T[]) => void, boolean] => [columns, () => undefined, true];

/* Opens a console modal; scenarios assert what the plugin asks for, not the modal. */
export const useModal = (): ((...args: unknown[]) => void) => () => undefined;

/* Feature flags default to off in tests; a scenario that needs one sets it before
 * rendering. The map is consulted during render, so no subscription is needed. */
const TEST_FLAGS: Record<string, boolean> = {};

export const setTestFlag = (flag: string, value: boolean): void => {
  TEST_FLAGS[flag] = value;
};

export const resetTestFlags = (): void => {
  Object.keys(TEST_FLAGS).forEach((flag) => delete TEST_FLAGS[flag]);
};

export const useFlag = (flag?: string): boolean => (flag ? Boolean(TEST_FLAGS[flag]) : false);

/* Metrics polling and its endpoint enum; scenarios do not assert usage numbers. */
export const PrometheusEndpoint = {
  LABELS: 'labels',
  QUERY: 'query',
  QUERY_RANGE: 'query_range',
  SERIES: 'series',
};

export const usePrometheusPoll = (): [unknown, boolean, unknown, unknown] => [
  undefined,
  true,
  undefined,
  undefined,
];

/* Renders the timestamp it is given; the console formats it relative to now. */
export const Timestamp = ({ timestamp }: { timestamp?: string }) => (
  <span data-testid="timestamp">{timestamp ?? '-'}</span>
);

/* The little resource-kind glyph shown next to links. */
export const ResourceIcon = () => null;

/* Titles the browser tab in the console. The harness has no tab to title, and
 * components render it next to their content, so it renders nothing. */
export const DocumentTitle = () => null;

/* Status icons the SDK re-exports. PatternFly 6 dropped the coloured variants,
 * so the neutral icons stand in; components only render them inside an Icon. */
export const GreenCheckCircleIcon = CheckCircleIcon;
export const RedExclamationCircleIcon = ExclamationCircleIcon;

/* The console's JSON fetch helper. Its only caller asks for the OpenAPI document
 * while its module is being imported, which runs before MSW starts listening, so
 * answer that path directly instead of issuing a request nothing can serve. */
export const consoleFetchJSON = async (url: string): Promise<unknown> => {
  if (url.endsWith('openapi/v2')) {
    return { definitions: {}, swagger: '2.0' };
  }

  throw new Error(`consoleFetchJSON has no integration-test response for ${url}`);
};
