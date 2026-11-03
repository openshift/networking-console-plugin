import React, { FC } from 'react';

import { SearchInput, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { NetworksSearchType } from '../utils/constants';

type SearchBarProps = {
  onSearchInputChange: (value: string) => void;
  onSearchTypeChange: (type: NetworksSearchType) => void;
  searchInput: string;
  searchType: NetworksSearchType;
};

const SearchBar: FC<SearchBarProps> = ({
  onSearchInputChange,
  onSearchTypeChange,
  searchInput,
  searchType,
}) => {
  const { t } = useNetworkingTranslation();

  const searchTypes: Array<{ label: string; value: NetworksSearchType }> = [
    { label: t('Name'), value: NetworksSearchType.Name },
    { label: t('Nodes'), value: NetworksSearchType.Nodes },
    { label: t('Configuration name'), value: NetworksSearchType.Configurations },
  ];

  return (
    <div className="physical-networks-table__search-group">
      <ToggleGroup aria-label={t('Search type')} isCompact>
        {searchTypes.map(({ label, value }) => (
          <ToggleGroupItem
            isSelected={searchType === value}
            key={value}
            onChange={() => onSearchTypeChange(value)}
            text={label}
          />
        ))}
      </ToggleGroup>
      <SearchInput
        aria-label={t('Filter physical networks search input')}
        className="physical-networks-table__search-input"
        onChange={(_event, value) => onSearchInputChange(value)}
        placeholder={t('Search by name')}
        type="search"
        value={searchInput}
      />
    </div>
  );
};

export default SearchBar;
