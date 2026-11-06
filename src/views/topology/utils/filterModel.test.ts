import { describe, expect, it } from '@jest/globals';
import { Model } from '@patternfly/react-topology';
import {
  FilterAttribute,
  FilterMatchType,
  FilterOperator,
  ResourceType,
  TopologyLayoutType,
} from '@views/topology/utils/constants';

import {
  applyAdvancedFilters,
  applyHideWorkloads,
  applyResourceTypeFilter,
  applySearchFilter,
  countNodesByResourceType,
  isDuplicateFilter,
  isResourceType,
  isSubsequenceMatch,
  isTopologyLayoutType,
  parseAdvancedFilters,
  parseResourceTypesParam,
  serializeAdvancedFilters,
  serializeResourceTypesParam,
} from './filterModel';

const createModel = (): Model =>
  ({
    edges: [
      { id: 'nad-1-pod-1', source: 'nad-1', target: 'pod-1', type: 'edge' },
      { id: 'nad-1-service-1', source: 'nad-1', target: 'service-1', type: 'edge' },
      { id: 'nad-1-vm-1', source: 'nad-1', target: 'vm-1', type: 'edge' },
      { id: 'pod-1-service-1', source: 'pod-1', target: 'service-1', type: 'edge' },
    ],
    graph: { id: 'graph' },
    nodes: [
      {
        data: { namespace: 'net-team', resourceType: ResourceType.NetworkAttachmentDefinition },
        id: 'nad-1',
        label: 'nad-team-a',
        type: 'node',
      },
      {
        data: { namespace: 'net-team', resourceType: ResourceType.Pod },
        id: 'pod-1',
        label: 'pod-a',
        type: 'node',
      },
      {
        data: { namespace: 'other', resourceType: ResourceType.Service },
        id: 'service-1',
        label: 'svc-b',
        type: 'node',
      },
      {
        data: { namespace: 'net-team', resourceType: ResourceType.VirtualMachine },
        id: 'vm-1',
        label: 'vm-a',
        type: 'node',
      },
    ],
    type: 'graph',
  }) as unknown as Model;

const nodeIds = (model: Model): string[] => (model.nodes ?? []).map((node) => node.id);

const edgeIds = (model: Model): string[] =>
  (model.edges ?? []).map((edge) => edge.id).filter((id): id is string => Boolean(id));

describe('filterModel', () => {
  it('matches labels by case-insensitive subsequence', () => {
    expect(isSubsequenceMatch('bd0', 'bond0')).toBe(true);
    expect(isSubsequenceMatch('BOND', 'bond0')).toBe(true);
    expect(isSubsequenceMatch('xyz', 'bond0')).toBe(false);
    expect(isSubsequenceMatch('', 'bond0')).toBe(false);
    expect(isSubsequenceMatch('bond', '')).toBe(false);
  });

  it('round-trips the resource type URL parameter', () => {
    expect(parseResourceTypesParam('Pod,Service,Pod,bogus')).toEqual([
      ResourceType.Pod,
      ResourceType.Service,
    ]);
    expect(parseResourceTypesParam(' Pod , Service ')).toEqual([
      ResourceType.Pod,
      ResourceType.Service,
    ]);
    expect(parseResourceTypesParam(null)).toEqual([]);
    expect(
      serializeResourceTypesParam([ResourceType.Pod, ResourceType.Service, ResourceType.Pod]),
    ).toBe('Pod,Service');
  });

  it('guards enum URL values', () => {
    expect(isResourceType('Pod')).toBe(true);
    expect(isResourceType('pod')).toBe(false);
    expect(isTopologyLayoutType(TopologyLayoutType.Dagre)).toBe(true);
    expect(isTopologyLayoutType('dagre')).toBe(false);
  });

  it('filters by resource type and prunes dangling edges', () => {
    const model = createModel();

    expect(applyResourceTypeFilter(model, [])).toBe(model);
    expect(
      nodeIds(
        applyResourceTypeFilter(model, [
          ResourceType.NetworkAttachmentDefinition,
          ResourceType.Pod,
        ]),
      ),
    ).toEqual(['nad-1', 'pod-1']);
    expect(
      edgeIds(
        applyResourceTypeFilter(model, [
          ResourceType.NetworkAttachmentDefinition,
          ResourceType.Pod,
        ]),
      ),
    ).toEqual(['nad-1-pod-1']);
    expect(nodeIds(applyResourceTypeFilter(model, [ResourceType.Ingress]))).toEqual([]);
    expect(edgeIds(applyResourceTypeFilter(model, [ResourceType.Ingress]))).toEqual([]);
  });

  it('filters by search query', () => {
    const model = createModel();

    expect(applySearchFilter(model, '   ')).toBe(model);
    expect(nodeIds(applySearchFilter(model, 'na'))).toEqual(['nad-1']);
    expect(edgeIds(applySearchFilter(model, 'na'))).toEqual([]);
    expect(nodeIds(applySearchFilter(model, 'POD'))).toEqual(['pod-1']);
    expect(edgeIds(applySearchFilter(model, 'POD'))).toEqual([]);
  });

  it('applies advanced filters with OR and AND match types', () => {
    const model = createModel();
    const svcName = {
      attribute: FilterAttribute.Name,
      operator: FilterOperator.Contains,
      value: 'svc',
    };
    const netTeam = {
      attribute: FilterAttribute.Namespace,
      operator: FilterOperator.Equals,
      value: 'net-team',
    };

    expect(applyAdvancedFilters(model, [], FilterMatchType.OR)).toBe(model);
    expect(nodeIds(applyAdvancedFilters(model, [svcName, netTeam], FilterMatchType.OR))).toEqual([
      'nad-1',
      'pod-1',
      'service-1',
      'vm-1',
    ]);
    expect(edgeIds(applyAdvancedFilters(model, [svcName, netTeam], FilterMatchType.OR))).toEqual([
      'nad-1-pod-1',
      'nad-1-service-1',
      'nad-1-vm-1',
      'pod-1-service-1',
    ]);
    expect(nodeIds(applyAdvancedFilters(model, [svcName, netTeam], FilterMatchType.AND))).toEqual(
      [],
    );
    expect(
      nodeIds(
        applyAdvancedFilters(
          model,
          [{ attribute: FilterAttribute.Name, operator: FilterOperator.NotEquals, value: 'pod-a' }],
          FilterMatchType.AND,
        ),
      ),
    ).toEqual(['nad-1', 'service-1', 'vm-1']);
  });

  it('rejects invalid advanced filters from the URL', () => {
    const svcName = {
      attribute: FilterAttribute.Name,
      operator: FilterOperator.Contains,
      value: 'svc',
    };

    expect(parseAdvancedFilters('not-json')).toEqual([]);
    expect(parseAdvancedFilters('{"a":1}')).toEqual([]);
    expect(
      parseAdvancedFilters(
        '[{"attribute":"Bogus","operator":"equals","value":"x"},{"attribute":"Name","operator":"contains","value":"svc"}]',
      ),
    ).toEqual([{ attribute: 'Name', operator: 'contains', value: 'svc' }]);
    expect(serializeAdvancedFilters([])).toBe('');
    expect(serializeAdvancedFilters([svcName])).toBe(
      '[{"attribute":"Name","operator":"contains","value":"svc"}]',
    );
    expect(parseAdvancedFilters(serializeAdvancedFilters([svcName]))).toEqual([svcName]);
    expect(isDuplicateFilter([svcName], { ...svcName })).toBe(true);
    expect(isDuplicateFilter([svcName], { ...svcName, operator: FilterOperator.Equals })).toBe(
      false,
    );
  });

  it('removes workload nodes and their edges when hideWorkloads is enabled', () => {
    const model = createModel();

    expect(applyHideWorkloads(model, false)).toBe(model);
    expect(nodeIds(applyHideWorkloads(model, true))).toEqual(['nad-1', 'service-1']);
    expect(edgeIds(applyHideWorkloads(model, true))).toEqual(['nad-1-service-1']);
  });

  it('counts nodes per resource type', () => {
    const model = createModel();
    const counts = countNodesByResourceType(model);

    expect(counts.get(ResourceType.Pod)).toBe(1);
    expect(counts.get(ResourceType.Service)).toBe(1);
    expect(counts.get(ResourceType.NetworkAttachmentDefinition)).toBe(1);
    expect(counts.get(ResourceType.VirtualMachine)).toBe(1);
    expect(counts.size).toBe(4);
    expect(countNodesByResourceType(undefined).size).toBe(0);
    expect(
      countNodesByResourceType({
        nodes: [{ data: {}, id: 'mystery', label: 'mystery', type: 'node' }],
      } as Model).size,
    ).toBe(0);
  });
});
