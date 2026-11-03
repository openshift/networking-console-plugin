import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { Divider, Stack, StackItem } from '@patternfly/react-core';
import {
  GRAPH_LAYOUT_END_EVENT,
  Model,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
} from '@patternfly/react-topology';
import { isEmpty } from '@utils/utils';
import ScopeSlider from '@views/topology/components/ScopeSlider';
import ControlBar from '@views/topology/components/TopologyControlBar';
import TopologyTableView from '@views/topology/components/TopologyTableView/TopologyTableView';
import TopologyToolbar from '@views/topology/components/TopologyToolbar';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import useTopologyFilters from '@views/topology/hooks/useTopologyFilters';
import useTopologyK8sModels from '@views/topology/hooks/useTopologyK8sModels';
import { DisplayOptionsState, TopologyDisplayMode, TopologyGroupType } from '@views/topology/types';
import {
  DEFAULT_DISPLAY_OPTIONS,
  DEFAULT_TOPOLOGY_GROUP,
  GRAPH_POSITIONING_EVENT,
  NODE_POSITIONING_EVENT,
  TopologyViewTypes,
} from '@views/topology/utils/constants';
import { generateDataModel } from '@views/topology/utils/dataTransformation/dataTransformation';
import { componentFactory, layoutFactory } from '@views/topology/utils/factories';
import {
  applyAdvancedFilters,
  applyHideWorkloads,
  applySearchFilter,
} from '@views/topology/utils/filterModel';
import { restoreNodePositions, saveNodePositions } from '@views/topology/utils/nodePositionUtils';
import { clearRemovedSelection } from '@views/topology/utils/visualizationUtils';

// TODO: Implement applyHideManagementPorts when the data model gains a management-port resource type.

const Topology: FC = () => {
  const k8sModels = useTopologyK8sModels();
  const [controller, setController] = useState<Visualization>();
  const [displayMode, setDisplayMode] = useState<TopologyDisplayMode>(TopologyDisplayMode.graph);
  const [displayOptions, setDisplayOptions] =
    useState<DisplayOptionsState>(DEFAULT_DISPLAY_OPTIONS);
  const [scope, setScope] = useState<TopologyViewTypes>(TopologyViewTypes.resource);
  const [group, setGroup] = useState<TopologyGroupType>(DEFAULT_TOPOLOGY_GROUP);
  const { resources } = useTopologyContext();
  const { advancedFilters, filterMatchType, layout, resourceTypes, searchQuery, setLayout } =
    useTopologyFilters();
  const laidOutModelRef = useRef<Model | undefined>(undefined);
  const visibleNodeIdsRef = useRef<Set<string> | undefined>(undefined);
  const prevLayoutRef = useRef(layout);
  const prevScopeRef = useRef(scope);

  const layoutGraph = useCallback((visualization: Visualization): boolean => {
    if (visualization.getGraph().getNodes().length === 0) {
      return false;
    }
    const bounds = visualization.getGraph().getBounds();
    if (!bounds || typeof bounds.width !== 'number' || typeof bounds.height !== 'number') {
      return false;
    }
    visualization.getGraph().layout();
    return true;
  }, []);

  const isSearchActive = searchQuery.trim().length > 0;
  const filterOptionsModel = useMemo(
    () =>
      !resources || isEmpty(resources)
        ? {}
        : generateDataModel(
            resources,
            TopologyViewTypes.resource,
            DEFAULT_TOPOLOGY_GROUP,
            [],
            k8sModels,
          ),
    [k8sModels, resources],
  );
  const filteredTopologyModel = useMemo(
    () =>
      !resources || isEmpty(resources)
        ? {}
        : generateDataModel(resources, scope, group, resourceTypes, k8sModels),
    [group, k8sModels, resources, resourceTypes, scope],
  );

  useEffect(() => {
    const afterWorkloads = applyHideWorkloads(filteredTopologyModel, displayOptions.hideWorkloads);
    const afterSearch = applySearchFilter(afterWorkloads, searchQuery);
    const filteredModel = applyAdvancedFilters(afterSearch, advancedFilters, filterMatchType);

    if (filteredModel.graph) {
      filteredModel.graph = { ...filteredModel.graph, layout };
    }

    const visibleNodeIds = new Set(filteredModel.nodes?.map((node) => node.id));
    const restoredNodes = [...visibleNodeIds].some((id) => !visibleNodeIdsRef.current?.has(id));
    const resourcesChanged = laidOutModelRef.current !== filteredTopologyModel;
    const layoutChanged = prevLayoutRef.current !== layout;
    const scopeChanged = prevScopeRef.current !== scope;
    laidOutModelRef.current = filteredTopologyModel;
    visibleNodeIdsRef.current = visibleNodeIds;
    prevLayoutRef.current = layout;
    prevScopeRef.current = scope;

    if (!controller) {
      const visualization = new Visualization();
      visualization.registerLayoutFactory(layoutFactory);
      visualization.registerComponentFactory(componentFactory);

      visualization.addEventListener(NODE_POSITIONING_EVENT, () =>
        saveNodePositions(visualization),
      );
      visualization.addEventListener(GRAPH_POSITIONING_EVENT, () =>
        saveNodePositions(visualization),
      );

      visualization.fromModel(filteredModel, false);
      setController(visualization);
      return;
    }

    if (layoutChanged) {
      const fitOnceAfterLayout = () => {
        controller.removeEventListener(GRAPH_LAYOUT_END_EVENT, fitOnceAfterLayout);
        controller.getGraph().fit(40);
      };
      controller.addEventListener(GRAPH_LAYOUT_END_EVENT, fitOnceAfterLayout);
      controller.fromModel(filteredModel, true);
      layoutGraph(controller);
    } else if (scopeChanged) {
      const fitOnceAfterScopeChange = () => {
        controller.removeEventListener(GRAPH_LAYOUT_END_EVENT, fitOnceAfterScopeChange);
        controller.getGraph().fit(40);
      };
      controller.addEventListener(GRAPH_LAYOUT_END_EVENT, fitOnceAfterScopeChange);
      controller.fromModel(filteredModel, true);
      if (!layoutGraph(controller)) {
        controller.removeEventListener(GRAPH_LAYOUT_END_EVENT, fitOnceAfterScopeChange);
      }
    } else if (resourcesChanged) {
      controller.fromModel(filteredModel, true);
      if (restoredNodes) {
        layoutGraph(controller);
        restoreNodePositions(controller);
      }
    } else {
      controller.fromModel(filteredModel, true);
      if (restoredNodes) {
        layoutGraph(controller);
      }
    }

    clearRemovedSelection(controller, filteredModel);
  }, [
    advancedFilters,
    controller,
    displayOptions.hideWorkloads,
    filterMatchType,
    layoutGraph,
    filteredTopologyModel,
    layout,
    resourceTypes,
    searchQuery,
    scope,
  ]);

  // Sync viewOptions to the controller state so CustomNode can read showLabels/compactView.
  useEffect(() => {
    if (!controller) return;
    controller.setState({
      viewOptions: {
        compactView: displayOptions.compactView,
        showLabels: displayOptions.showLabels,
      },
    });
  }, [controller, displayOptions.compactView, displayOptions.showLabels]);

  // Re-run fit after mount to ensure correct scale when container size stabilizes (e.g. navigation from create flow)
  useEffect(() => {
    if (!controller) return;

    const id = requestAnimationFrame(() => {
      if (layoutGraph(controller)) {
        restoreNodePositions(controller);
        controller.getGraph().fit(40);
      }
    });

    return () => cancelAnimationFrame(id);
  }, [controller, layoutGraph]);

  const handleDisplayOptionsChange = useCallback((options: DisplayOptionsState) => {
    setDisplayOptions(options);
  }, []);

  const handleScopeChange = useCallback((nextScope: TopologyViewTypes) => {
    setScope(nextScope);
    setGroup((currentGroup) => {
      if (
        String(currentGroup) === String(nextScope) ||
        ([TopologyViewTypes.namespace, TopologyViewTypes.network].includes(nextScope) &&
          currentGroup === TopologyGroupType.owner) ||
        (nextScope !== TopologyViewTypes.resource &&
          currentGroup === TopologyGroupType.namespaceOwner)
      ) {
        return TopologyGroupType.none;
      }
      return currentGroup;
    });
  }, []);

  const isTableView = displayMode === TopologyDisplayMode.table;

  const toolbar = (
    <TopologyToolbar
      displayMode={displayMode}
      displayOptions={displayOptions}
      group={group}
      layout={layout}
      model={filterOptionsModel}
      onDisplayModeChange={setDisplayMode}
      onDisplayOptionsChange={handleDisplayOptionsChange}
      onGroupChange={setGroup}
      onLayoutChange={setLayout}
      onScopeChange={handleScopeChange}
      scope={scope}
    />
  );

  return (
    <Stack style={{ height: '100%' }}>
      <StackItem>
        {toolbar}
        <Divider />
      </StackItem>
      <StackItem isFilled style={{ overflow: isTableView ? 'auto' : 'hidden' }}>
        {isTableView ? (
          <TopologyTableView />
        ) : (
          <div className="networking-topology__visualization">
            <ScopeSlider onScopeChange={handleScopeChange} scope={scope} />
            <div className="networking-topology__canvas">
              <VisualizationProvider controller={controller}>
                <TopologyView
                  className={classNames({ 'networking-topology--filter-active': isSearchActive })}
                  controlBar={<ControlBar controller={controller} model={filteredTopologyModel} />}
                >
                  <VisualizationSurface />
                </TopologyView>
              </VisualizationProvider>
            </div>
          </div>
        )}
      </StackItem>
    </Stack>
  );
};

export default Topology;
