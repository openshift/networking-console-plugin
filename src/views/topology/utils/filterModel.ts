import { TFunction } from 'i18next';

import {
  IoK8sApiNetworkingV1Ingress,
  IoK8sApiNetworkingV1NetworkPolicy,
  IoK8sApiNetworkingV1NetworkPolicyIngressRule,
} from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Model, NodeModel } from '@patternfly/react-topology';
import { RouteKind } from '@utils/types';
import {
  FilterAttribute,
  FilterMatchType,
  FilterOperator,
  ResourceType,
  TopologyLayoutType,
} from '@views/topology/utils/constants';

const resourceTypeValues = new Set<string>(Object.values(ResourceType));

export const isResourceType = (value: unknown): value is ResourceType =>
  typeof value === 'string' && resourceTypeValues.has(value);

const topologyLayoutValues = new Set<string>(Object.values(TopologyLayoutType));

export const isTopologyLayoutType = (value: unknown): value is TopologyLayoutType =>
  typeof value === 'string' && topologyLayoutValues.has(value);

export const isSubsequenceMatch = (query: string, label: string): boolean => {
  if (!query || !label) {
    return false;
  }

  const normalizedQuery = query.toLowerCase();
  const normalizedLabel = label.toLowerCase();
  let queryIndex = 0;

  for (
    let labelIndex = 0;
    labelIndex < normalizedLabel.length && queryIndex < normalizedQuery.length;
    labelIndex++
  ) {
    if (normalizedLabel[labelIndex] === normalizedQuery[queryIndex]) {
      queryIndex += 1;
    }
  }

  return queryIndex === normalizedQuery.length;
};

export const parseResourceTypesParam = (value: null | string): ResourceType[] => {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();
  const types: ResourceType[] = [];

  value.split(',').forEach((part) => {
    const trimmed = part.trim();
    if (isResourceType(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      types.push(trimmed);
    }
  });

  return types;
};

export const serializeResourceTypesParam = (types: ResourceType[]): string =>
  types.filter((type, index) => types.indexOf(type) === index).join(',');

export const countNodesByResourceType = (model: Model | undefined): Map<ResourceType, number> => {
  const counts = new Map<ResourceType, number>();

  model?.nodes?.forEach((node) => {
    const resourceType = node.data?.resourceType;
    if (!isResourceType(resourceType)) {
      return;
    }

    counts.set(resourceType, (counts.get(resourceType) ?? 0) + 1);
  });

  return counts;
};

const modelWithNodes = (model: Model, nodes: Model['nodes']): Model => {
  const keptIds = new Set(nodes?.map((node) => node.id));
  const edges = (model.edges ?? []).filter(
    (edge) =>
      !!edge.source && !!edge.target && keptIds.has(edge.source) && keptIds.has(edge.target),
  );

  return { ...model, edges, nodes };
};

export const applyResourceTypeFilter = (model: Model, selectedTypes: ResourceType[]): Model => {
  if (selectedTypes.length === 0) {
    return model;
  }

  const selected = new Set<string>(selectedTypes);
  const nodes = (model.nodes ?? []).filter(
    (node) => isResourceType(node.data?.resourceType) && selected.has(node.data.resourceType),
  );

  return modelWithNodes(model, nodes);
};

export const applySearchFilter = (model: Model, query: string): Model => {
  const trimmed = query.trim();
  if (!trimmed) {
    return model;
  }

  const nodes = (model.nodes ?? []).filter((node) => isSubsequenceMatch(trimmed, node.label ?? ''));

  return modelWithNodes(model, nodes);
};

// --- Advanced filter types, labels, and helpers ---

export interface AdvancedFilter {
  attribute: FilterAttribute;
  operator: FilterOperator;
  value: string;
}

export const attributeLabel = (t: TFunction, attribute: FilterAttribute): string => {
  switch (attribute) {
    case FilterAttribute.Destination:
      return t('Destination');
    case FilterAttribute.Endpoint:
      return t('Endpoint');
    case FilterAttribute.ICMP:
      return t('ICMP');
    case FilterAttribute.IP:
      return t('IP');
    case FilterAttribute.Kind:
      return t('Kind');
    case FilterAttribute.MAC:
      return t('MAC');
    case FilterAttribute.Name:
      return t('Name');
    case FilterAttribute.Namespace:
      return t('Namespace');
    case FilterAttribute.Source:
      return t('Source');
  }
};

export const operatorLabel = (t: TFunction, operator: FilterOperator): string => {
  switch (operator) {
    case FilterOperator.Contains:
      return t('contains');
    case FilterOperator.Equals:
      return t('equals');
    case FilterOperator.NotEquals:
      return t('not equals');
  }
};

const filterAttributeValues = new Set<string>(Object.values(FilterAttribute));
const filterOperatorValues = new Set<string>(Object.values(FilterOperator));

const isAdvancedFilter = (item: unknown): item is AdvancedFilter =>
  typeof item === 'object' &&
  item !== null &&
  filterAttributeValues.has((item as AdvancedFilter).attribute) &&
  filterOperatorValues.has((item as AdvancedFilter).operator) &&
  typeof (item as AdvancedFilter).value === 'string';

export const serializeAdvancedFilters = (filters: AdvancedFilter[]): string => {
  if (filters.length === 0) {
    return '';
  }
  try {
    return JSON.stringify(filters);
  } catch {
    return '';
  }
};

export const parseAdvancedFilters = (value: null | string): AdvancedFilter[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isAdvancedFilter);
  } catch {
    return [];
  }
};

const filterMatchTypeValues = new Set<string>(Object.values(FilterMatchType));

export const isFilterMatchType = (value: unknown): value is FilterMatchType =>
  typeof value === 'string' && filterMatchTypeValues.has(value);

export const isDuplicateFilter = (existing: AdvancedFilter[], candidate: AdvancedFilter): boolean =>
  existing.some(
    (f) =>
      f.attribute === candidate.attribute &&
      f.operator === candidate.operator &&
      f.value === candidate.value,
  );

const MAC_REGEX = /([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/g;

const extractPolicySourceValues = (policy: IoK8sApiNetworkingV1NetworkPolicy): string[] => {
  const values: string[] = [];
  policy.spec?.ingress?.forEach((rule) => {
    rule.from?.forEach((peer) => {
      if (peer.ipBlock?.cidr) values.push(peer.ipBlock.cidr);
      const nsLabels = peer.namespaceSelector?.matchLabels;
      if (nsLabels) {
        Object.entries(nsLabels).forEach(([k, v]) => values.push(`${k}=${v}`));
      }
      const podLabels = peer.podSelector?.matchLabels;
      if (podLabels) {
        Object.entries(podLabels).forEach(([k, v]) => values.push(`${k}=${v}`));
      }
    });
  });
  return values;
};

const extractPolicyDestinationValues = (policy: IoK8sApiNetworkingV1NetworkPolicy): string[] => {
  const values: string[] = [];
  policy.spec?.egress?.forEach((rule) => {
    rule.to?.forEach((peer) => {
      if (peer.ipBlock?.cidr) values.push(peer.ipBlock.cidr);
      const nsLabels = peer.namespaceSelector?.matchLabels;
      if (nsLabels) {
        Object.entries(nsLabels).forEach(([k, v]) => values.push(`${k}=${v}`));
      }
      const podLabels = peer.podSelector?.matchLabels;
      if (podLabels) {
        Object.entries(podLabels).forEach(([k, v]) => values.push(`${k}=${v}`));
      }
    });
  });
  return values;
};

const extractIPValues = (resource: unknown): string[] => {
  const r = resource as any;
  const values: string[] = [];

  if (typeof r?.spec?.clusterIP === 'string') values.push(r.spec.clusterIP);
  if (Array.isArray(r?.spec?.externalIPs)) {
    values.push(...r.spec.externalIPs.filter((ip: unknown) => typeof ip === 'string'));
  }
  if (typeof r?.spec?.loadBalancerIP === 'string') values.push(r.spec.loadBalancerIP);

  if (Array.isArray(r?.status?.loadBalancer?.ingress)) {
    for (const ing of r.status.loadBalancer.ingress) {
      if (ing?.ip) values.push(ing.ip);
    }
  }

  const policy = r as IoK8sApiNetworkingV1NetworkPolicy;
  policy.spec?.ingress?.forEach((rule) => {
    rule.from?.forEach((peer) => {
      if (peer.ipBlock?.cidr) values.push(peer.ipBlock.cidr);
      peer.ipBlock?.except?.forEach((exc) => values.push(exc));
    });
  });
  policy.spec?.egress?.forEach((rule) => {
    rule.to?.forEach((peer) => {
      if (peer.ipBlock?.cidr) values.push(peer.ipBlock.cidr);
      peer.ipBlock?.except?.forEach((exc) => values.push(exc));
    });
  });

  const addSubnets = (layer: { subnets?: { cidr?: string }[] } | undefined) => {
    layer?.subnets?.forEach((s) => {
      if (s.cidr) values.push(s.cidr);
    });
  };
  addSubnets(r?.spec?.layer2);
  addSubnets(r?.spec?.layer3);

  return values;
};

const extractIngressBackends = (ingress: IoK8sApiNetworkingV1Ingress): string[] => {
  const backends: string[] = [];
  const defaultService = ingress.spec?.defaultBackend?.service?.name;
  if (defaultService) {
    backends.push(defaultService);
  }
  ingress.spec?.rules?.forEach((rule) => {
    rule.http?.paths?.forEach((path) => {
      const serviceName = path.backend?.service?.name;
      if (serviceName) {
        backends.push(serviceName);
      }
    });
  });
  return backends;
};

const extractRouteBackends = (route: RouteKind): string[] => {
  const backends: string[] = [];
  if (route.spec?.to?.name) {
    backends.push(route.spec.to.name);
  }
  route.spec?.alternateBackends?.forEach((backend) => {
    if (backend.name) {
      backends.push(backend.name);
    }
  });
  return backends;
};

const extractAttributeValues = (node: NodeModel, attribute: FilterAttribute): string[] => {
  const data = node.data;
  const resource = data?.resource;

  switch (attribute) {
    case FilterAttribute.Name:
      return [node.label ?? ''].filter(Boolean);

    case FilterAttribute.Namespace:
      return [data?.namespace ?? ''].filter(Boolean);

    case FilterAttribute.Kind:
      return [data?.resourceType ?? resource?.kind ?? ''].filter(Boolean);

    case FilterAttribute.Source:
      return resource?.spec?.ingress
        ? extractPolicySourceValues(resource as IoK8sApiNetworkingV1NetworkPolicy)
        : [];

    case FilterAttribute.Destination: {
      const values: string[] = [];
      if (data?.resourceType === ResourceType.Ingress) {
        values.push(...extractIngressBackends(resource as IoK8sApiNetworkingV1Ingress));
      }
      if (data?.resourceType === ResourceType.Route) {
        values.push(...extractRouteBackends(resource as RouteKind));
      }
      if (resource?.spec?.egress) {
        values.push(
          ...extractPolicyDestinationValues(resource as IoK8sApiNetworkingV1NetworkPolicy),
        );
      }
      return values;
    }

    case FilterAttribute.Endpoint: {
      const values: string[] = [];
      const spec = resource?.spec as any;
      if (typeof spec?.clusterIP === 'string') values.push(spec.clusterIP);
      if (Array.isArray(spec?.ports)) {
        for (const port of spec.ports) {
          if (port?.port) values.push(`${port.port}/${port.protocol || 'TCP'}`);
          if (port?.targetPort) values.push(String(port.targetPort));
          if (port?.name) values.push(port.name);
        }
      }
      return values;
    }

    case FilterAttribute.IP:
      return extractIPValues(resource);

    case FilterAttribute.MAC: {
      const config = resource?.spec?.config;
      if (typeof config === 'string') {
        return config.match(MAC_REGEX) ?? [];
      }
      return [];
    }

    case FilterAttribute.ICMP: {
      const values: string[] = [];
      const policy = resource as IoK8sApiNetworkingV1NetworkPolicy | undefined;
      const checkPorts = (rules: IoK8sApiNetworkingV1NetworkPolicyIngressRule[] | undefined) => {
        rules?.forEach((rule) => {
          rule.ports?.forEach((port) => {
            if (typeof port?.protocol === 'string' && port.protocol.toLowerCase() === 'icmp') {
              values.push('ICMP');
            }
          });
        });
      };
      checkPorts(policy?.spec?.ingress);
      checkPorts(policy?.spec?.egress);
      return values;
    }

    default:
      return [];
  }
};

const matchesFilter = (node: NodeModel, filter: AdvancedFilter): boolean => {
  const values = extractAttributeValues(node, filter.attribute);
  const query = filter.value.toLowerCase();

  switch (filter.operator) {
    case FilterOperator.Contains:
      return values.some((v) => v.toLowerCase().includes(query));
    case FilterOperator.Equals:
      return values.some((v) => v.toLowerCase() === query);
    case FilterOperator.NotEquals:
      return values.every((v) => v.toLowerCase() !== query);
    default:
      return true;
  }
};

export const applyAdvancedFilters = (
  model: Model,
  filters: AdvancedFilter[],
  matchType: FilterMatchType,
): Model => {
  if (filters.length === 0) {
    return model;
  }

  const nodes = (model.nodes ?? []).filter((node) => {
    if (matchType === FilterMatchType.AND) {
      return filters.every((filter) => matchesFilter(node, filter));
    }
    return filters.some((filter) => matchesFilter(node, filter));
  });

  return modelWithNodes(model, nodes);
};

const WORKLOAD_RESOURCE_TYPES = new Set<string>([ResourceType.Pod, ResourceType.VirtualMachine]);

export const applyHideWorkloads = (model: Model, hide: boolean): Model => {
  if (!hide) {
    return model;
  }

  const nodes = (model.nodes ?? []).filter(
    (node) => !WORKLOAD_RESOURCE_TYPES.has(node.data?.resourceType),
  );

  const keptIds = new Set(nodes.map((node) => node.id));
  const edges = (model.edges ?? []).filter(
    (edge) =>
      !!edge.source && !!edge.target && keptIds.has(edge.source) && keptIds.has(edge.target),
  );

  return { ...model, edges, nodes };
};

export const resourceTypeLabel = (t: TFunction, type: ResourceType): string => {
  switch (type) {
    case ResourceType.ClusterUserDefinedNetwork:
      return t('ClusterUserDefinedNetwork');
    case ResourceType.Ingress:
      return t('Ingress');
    case ResourceType.MultiNetworkPolicy:
      return t('MultiNetworkPolicy');
    case ResourceType.NetworkAttachmentDefinition:
      return t('NetworkAttachmentDefinition');
    case ResourceType.NetworkPolicy:
      return t('NetworkPolicy');
    case ResourceType.Pod:
      return t('Pod');
    case ResourceType.Route:
      return t('Route');
    case ResourceType.Service:
      return t('Service');
    case ResourceType.UserDefinedNetwork:
      return t('UserDefinedNetwork');
    case ResourceType.VirtualMachine:
      return t('VirtualMachine');
  }
};
