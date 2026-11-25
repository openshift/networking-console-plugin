import React, { FC, useMemo } from 'react';

import { Popover, ProgressStep, ProgressStepper } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { TopologyViewTypes } from '@views/topology/utils/constants';

import { getScopeDefinitions, getScopeDescription, getScopeLabel } from './utils';

import './ScopeSlider.scss';

type ScopeSliderProps = {
  nmstateAvailable: boolean;
  onScopeChange: (scope: TopologyViewTypes) => void;
  scope: TopologyViewTypes;
};

const ScopeSlider: FC<ScopeSliderProps> = ({ nmstateAvailable, onScopeChange, scope }) => {
  const { t } = useNetworkingTranslation();

  const scopeDefinitions = useMemo(
    () => getScopeDefinitions(nmstateAvailable),
    [nmstateAvailable],
  );

  return (
    <div
      aria-label={t('Topology scope')}
      className="networking-topology__scope-slider"
      role="group"
    >
      <ProgressStepper isCenterAligned isVertical>
        {scopeDefinitions.map((definition) => (
          <ProgressStep
            id={`topology-scope-${definition.id}`}
            isCurrent={definition.id === scope}
            key={definition.id}
            onClick={() => onScopeChange(definition.id)}
            popoverRender={(stepRef) => (
              <Popover
                bodyContent={<div>{getScopeDescription(t, definition.id)}</div>}
                headerContent={<div>{getScopeLabel(t, definition.id)}</div>}
                position="right"
                triggerRef={stepRef}
              />
            )}
            titleId={`topology-scope-title-${definition.id}`}
            variant={definition.id === scope ? 'info' : 'pending'}
          >
            {getScopeLabel(t, definition.id)}
          </ProgressStep>
        ))}
      </ProgressStepper>
    </div>
  );
};

export default ScopeSlider;
