import React, { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';

import { SearchInput } from '@patternfly/react-core';

import { ConfigurationDetails, EnactmentState, NodeEnactmentStateDetails } from '../utils/types';

import EnactmentStateFilter from './EnactmentStateFilter';
import EnactmentStateTable from './EnactmentStateTable';

const ALL_STATES: EnactmentState[] = [
  EnactmentState.Progressing,
  EnactmentState.Available,
  EnactmentState.Aborted,
  EnactmentState.Failing,
  EnactmentState.Pending,
];

const filterEnactmentStateDetails = (
  details: NodeEnactmentStateDetails[],
  searchInput: string,
  states: EnactmentState[],
): NodeEnactmentStateDetails[] =>
  details.filter(
    ({ node, status }) =>
      (node?.metadata?.name?.includes(searchInput) ?? false) &&
      states.includes(EnactmentState[status as keyof typeof EnactmentState]),
  );

type EnactmentStateTabProps = {
  selectedConfiguration: ConfigurationDetails;
};

const EnactmentStateTab: FC<EnactmentStateTabProps> = ({ selectedConfiguration }) => {
  const [searchInput, setSearchInput] = useState('');
  const [enactmentStateFilters, setEnactmentStateFilters] =
    useState<EnactmentState[]>(ALL_STATES);
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
          setSelectedFilterType={
            setEnactmentStateFilters as Dispatch<SetStateAction<EnactmentState[]>>
          }
        />
        <SearchInput
          aria-label="Filter nodes"
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
