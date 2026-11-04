import React, { FC, useMemo, useState } from 'react';

import { SearchInput } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { ENACTMENT_STATES } from '../../utils/constants';
import { ConfigurationDetails, EnactmentState } from '../../utils/types';
import { filterEnactmentStateDetails } from '../utils/utils';

import EnactmentStateFilter from './EnactmentStateFilter';
import EnactmentStateTable from './EnactmentStateTable';

type EnactmentStateTabProps = {
  selectedConfiguration: ConfigurationDetails;
};

const EnactmentStateTab: FC<EnactmentStateTabProps> = ({ selectedConfiguration }) => {
  const { t } = useNetworkingTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [enactmentStateFilters, setEnactmentStateFilters] =
    useState<EnactmentState[]>(ENACTMENT_STATES);
  const { nodeToEnactmentStateMap } = selectedConfiguration;

  const filteredEnactmentStates = useMemo(
    () =>
      filterEnactmentStateDetails(
        Object.values(nodeToEnactmentStateMap || {}),
        searchInput,
        enactmentStateFilters,
      ),
    [enactmentStateFilters, nodeToEnactmentStateMap, searchInput],
  );

  return (
    <div className="pf-v6-u-my-xl">
      <div className="pf-v6-u-mb-md pf-v6-u-display-flex pf-v6-u-gap-md">
        <EnactmentStateFilter
          selectedFilterType={enactmentStateFilters}
          setSelectedFilterType={setEnactmentStateFilters}
        />
        <SearchInput
          aria-label={t('Filter nodes')}
          onChange={(_event, value) => setSearchInput(value)}
          type="search"
          value={searchInput}
        />
      </div>
      <EnactmentStateTable nodeEnactmentStateDetails={filteredEnactmentStates} />
    </div>
  );
};

export default EnactmentStateTab;
