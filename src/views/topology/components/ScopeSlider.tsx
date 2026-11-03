import React, { FC } from 'react';

import { Popover, ProgressStep, ProgressStepper } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { TOPOLOGY_SCOPE_ORDER, TopologyViewTypes } from '@views/topology/utils/constants';

import './ScopeSlider.scss';

type ScopeSliderProps = {
  onScopeChange: (scope: TopologyViewTypes) => void;
  scope: TopologyViewTypes;
};

const SCOPE_DEFINITIONS: { id: TopologyViewTypes }[] = TOPOLOGY_SCOPE_ORDER.map((id) => ({ id }));

const scopeLabel = (
  t: ReturnType<typeof useNetworkingTranslation>['t'],
  scope: TopologyViewTypes,
) => {
  switch (scope) {
    case TopologyViewTypes.network:
      return t('Network');
    case TopologyViewTypes.owner:
      return t('Owner');
    case TopologyViewTypes.namespace:
      return t('Namespace');
    case TopologyViewTypes.resource:
      return t('Resource');
  }
};

const scopeDescription = (
  t: ReturnType<typeof useNetworkingTranslation>['t'],
  scope: TopologyViewTypes,
) => {
  switch (scope) {
    case TopologyViewTypes.network:
      return t(
        'Show NetworkAttachmentDefinitions, UserDefinedNetworks, and ClusterUserDefinedNetworks as logical network nodes.',
      );
    case TopologyViewTypes.owner:
      return t(
        'Replace resources with their controller owner when one is available; ownerless resources remain unchanged.',
      );
    case TopologyViewTypes.namespace:
      return t(
        'Replace namespaced resources with their namespace; cluster-scoped resources remain unchanged.',
      );
    case TopologyViewTypes.resource:
      return t('Show individual resources using their Kubernetes kind and name.');
  }
};

const ScopeSlider: FC<ScopeSliderProps> = ({ onScopeChange, scope }) => {
  const { t } = useNetworkingTranslation();

  return (
    <div aria-label={t('Topology scope')} className="networking-topology__scope-slider">
      <ProgressStepper isCenterAligned isVertical>
        {SCOPE_DEFINITIONS.map((definition) => (
          <ProgressStep
            id={`topology-scope-${definition.id}`}
            isCurrent={definition.id === scope}
            key={definition.id}
            onClick={() => onScopeChange(definition.id)}
            popoverRender={(stepRef) => (
              <Popover
                bodyContent={<div>{scopeDescription(t, definition.id)}</div>}
                headerContent={<div>{scopeLabel(t, definition.id)}</div>}
                position="right"
                triggerRef={stepRef}
              />
            )}
            titleId={`topology-scope-title-${definition.id}`}
            variant={definition.id === scope ? 'info' : 'pending'}
          >
            {scopeLabel(t, definition.id)}
          </ProgressStep>
        ))}
      </ProgressStepper>
    </div>
  );
};

export default ScopeSlider;
