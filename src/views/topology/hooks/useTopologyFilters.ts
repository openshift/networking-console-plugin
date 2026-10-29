import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import {
  DEFAULT_TOPOLOGY_LAYOUT,
  FilterMatchType,
  ResourceType,
  TOPOLOGY_ADVANCED_FILTERS_PARAM,
  TOPOLOGY_FILTER_MATCH_PARAM,
  TOPOLOGY_LAYOUT_PARAM,
  TOPOLOGY_RESOURCE_TYPES_PARAM,
  TOPOLOGY_SEARCH_QUERY_PARAM,
  TopologyLayoutType,
} from '@views/topology/utils/constants';
import {
  AdvancedFilter,
  isFilterMatchType,
  isTopologyLayoutType,
  parseAdvancedFilters,
  parseResourceTypesParam,
  serializeAdvancedFilters,
  serializeResourceTypesParam,
} from '@views/topology/utils/filterModel';

const useTopologyFilters = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceTypesParam = searchParams.get(TOPOLOGY_RESOURCE_TYPES_PARAM) ?? '';
  const resourceTypes = useMemo(
    () => parseResourceTypesParam(resourceTypesParam),
    [resourceTypesParam],
  );
  const searchQuery = searchParams.get(TOPOLOGY_SEARCH_QUERY_PARAM) ?? '';

  const layoutParam = searchParams.get(TOPOLOGY_LAYOUT_PARAM);
  const layout: TopologyLayoutType = isTopologyLayoutType(layoutParam)
    ? layoutParam
    : DEFAULT_TOPOLOGY_LAYOUT;

  const advancedFiltersParam = searchParams.get(TOPOLOGY_ADVANCED_FILTERS_PARAM) ?? '';
  const advancedFilters = useMemo(
    () => parseAdvancedFilters(advancedFiltersParam),
    [advancedFiltersParam],
  );

  const filterMatchParam = searchParams.get(TOPOLOGY_FILTER_MATCH_PARAM);
  const filterMatchType: FilterMatchType = isFilterMatchType(filterMatchParam)
    ? filterMatchParam
    : FilterMatchType.AND;

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      const nextSearch = next.toString();

      if (nextSearch === searchParams.toString()) {
        return;
      }

      navigate(
        {
          hash: location.hash,
          pathname: location.pathname,
          search: nextSearch,
        },
        { replace: true, state: location.state },
      );
    },
    [location.hash, location.pathname, location.state, navigate, searchParams],
  );

  const setResourceTypes = useCallback(
    (types: ResourceType[]) => {
      replaceSearchParams((params) => {
        const serialized = serializeResourceTypesParam(types);
        if (serialized) {
          params.set(TOPOLOGY_RESOURCE_TYPES_PARAM, serialized);
        } else {
          params.delete(TOPOLOGY_RESOURCE_TYPES_PARAM);
        }
      });
    },
    [replaceSearchParams],
  );

  const setSearchQuery = useCallback(
    (value: string) => {
      replaceSearchParams((params) => {
        const trimmed = value.trim();
        if (trimmed) {
          params.set(TOPOLOGY_SEARCH_QUERY_PARAM, trimmed);
        } else {
          params.delete(TOPOLOGY_SEARCH_QUERY_PARAM);
        }
      });
    },
    [replaceSearchParams],
  );

  const setAdvancedFilters = useCallback(
    (filters: AdvancedFilter[]) => {
      replaceSearchParams((params) => {
        const serialized = serializeAdvancedFilters(filters);
        if (serialized) {
          params.set(TOPOLOGY_ADVANCED_FILTERS_PARAM, serialized);
        } else {
          params.delete(TOPOLOGY_ADVANCED_FILTERS_PARAM);
        }
      });
    },
    [replaceSearchParams],
  );

  const setFilterMatchType = useCallback(
    (matchType: FilterMatchType) => {
      replaceSearchParams((params) => {
        if (matchType === FilterMatchType.AND) {
          params.delete(TOPOLOGY_FILTER_MATCH_PARAM);
        } else {
          params.set(TOPOLOGY_FILTER_MATCH_PARAM, matchType);
        }
      });
    },
    [replaceSearchParams],
  );

  const setLayout = useCallback(
    (value: TopologyLayoutType) => {
      replaceSearchParams((params) => {
        if (value === DEFAULT_TOPOLOGY_LAYOUT) {
          params.delete(TOPOLOGY_LAYOUT_PARAM);
        } else {
          params.set(TOPOLOGY_LAYOUT_PARAM, value);
        }
      });
    },
    [replaceSearchParams],
  );

  return {
    advancedFilters,
    filterMatchType,
    layout,
    resourceTypes,
    searchQuery,
    setAdvancedFilters,
    setFilterMatchType,
    setLayout,
    setResourceTypes,
    setSearchQuery,
  };
};

export default useTopologyFilters;
