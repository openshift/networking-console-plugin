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
import ControlBar from '@views/topology/components/TopologyControlBar';
import TopologyTableView from '@views/topology/components/TopologyTableView/TopologyTableView';
import TopologyToolbar from '@views/topology/components/TopologyToolbar';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import useTopologyFilters from '@views/topology/hooks/useTopologyFilters';
import { DisplayOptionsState, TopologyDisplayMode } from '@views/topology/types';
import {
  DEFAULT_DISPLAY_OPTIONS,
  GRAPH_POSITIONING_EVENT,
  NODE_POSITIONING_EVENT,
} from '@views/topology/utils/constants';
import { generateDataModel } from '@views/topology/utils/dataTransformation/dataTransformation';
import { componentFactory, layoutFactory } from '@views/topology/utils/factories';
import {
  applyAdvancedFilters,
  applyHideWorkloads,
  applyResourceTypeFilter,
  applySearchFilter,
} from '@views/topology/utils/filterModel';
import { restoreNodePositions, saveNodePositions } from '@views/topology/utils/nodePositionUtils';
import { clearRemovedSelection } from '@views/topology/utils/visualizationUtils';

// TODO: Implement applyHideManagementPorts when the data model gains a management-port resource type.

const Topology: FC = () => {
  const [controller, setController] = useState<Visualization>();
  const [displayMode, setDisplayMode] = useState<TopologyDisplayMode>(TopologyDisplayMode.graph);
  const [displayOptions, setDisplayOptions] =
    useState<DisplayOptionsState>(DEFAULT_DISPLAY_OPTIONS);
  const { resources } = useTopologyContext();
  const { advancedFilters, filterMatchType, layout, resourceTypes, searchQuery, setLayout } =
    useTopologyFilters();
  const laidOutModelRef = useRef<Model | undefined>(undefined);
  const visibleNodeIdsRef = useRef<Set<string> | undefined>(undefined);
  const prevLayoutRef = useRef(layout);

  const isSearchActive = searchQuery.trim().length > 0;
  const topologyModel = useMemo(
    () => (!resources || isEmpty(resources) ? {} : generateDataModel(resources)),
    [resources],
  );

  useEffect(() => {
    const afterResourceTypes = applyResourceTypeFilter(topologyModel, resourceTypes);
    const afterWorkloads = applyHideWorkloads(afterResourceTypes, displayOptions.hideWorkloads);
    const afterSearch = applySearchFilter(afterWorkloads, searchQuery);
    const filteredModel = applyAdvancedFilters(afterSearch, advancedFilters, filterMatchType);

    if (filteredModel.graph) {
      filteredModel.graph = { ...filteredModel.graph, layout };
    }

    const visibleNodeIds = new Set(filteredModel.nodes?.map((node) => node.id));
    const restoredNodes = [...visibleNodeIds].some((id) => !visibleNodeIdsRef.current?.has(id));
    const resourcesChanged = laidOutModelRef.current !== topologyModel;
    const layoutChanged = prevLayoutRef.current !== layout;
    laidOutModelRef.current = topologyModel;
    visibleNodeIdsRef.current = visibleNodeIds;
    prevLayoutRef.current = layout;

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
      visualization.getGraph().layout();
      restoreNodePositions(visualization);
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
      controller.getGraph().layout();
    } else if (resourcesChanged) {
      controller.fromModel(filteredModel, true);
      if (restoredNodes) {
        controller.getGraph().layout();
        restoreNodePositions(controller);
      }
    } else {
      controller.fromModel(filteredModel, true);
      if (restoredNodes) {
        controller.getGraph().layout();
      }
    }

    clearRemovedSelection(controller, filteredModel);
  }, [
    advancedFilters,
    controller,
    displayOptions.hideWorkloads,
    filterMatchType,
    topologyModel,
    layout,
    resourceTypes,
    searchQuery,
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
      controller.getGraph().fit(40);
    });

    return () => cancelAnimationFrame(id);
  }, [controller]);

  const handleDisplayOptionsChange = useCallback((options: DisplayOptionsState) => {
    setDisplayOptions(options);
  }, []);

  const isTableView = displayMode === TopologyDisplayMode.table;

  const toolbar = (
    <TopologyToolbar
      displayMode={displayMode}
      displayOptions={displayOptions}
      layout={layout}
      model={topologyModel}
      onDisplayModeChange={setDisplayMode}
      onDisplayOptionsChange={handleDisplayOptionsChange}
      onLayoutChange={setLayout}
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
          <VisualizationProvider controller={controller}>
            <TopologyView
              className={classNames({ 'networking-topology--filter-active': isSearchActive })}
              controlBar={<ControlBar controller={controller} />}
            >
              <VisualizationSurface />
            </TopologyView>
          </VisualizationProvider>
        )}
      </StackItem>
    </Stack>
  );
};

export default Topology;
