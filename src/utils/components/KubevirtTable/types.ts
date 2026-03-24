import { ReactNode } from 'react';

import { SortByDirection } from '@patternfly/react-table';

export type ColumnConfig<TData> = {
  additional?: boolean;
  getValue?: (row: TData) => number | string;
  key: string;
  label: string;
  props?: Record<string, unknown>;
  renderCell: (row: TData) => ReactNode;
  sort?: (data: TData[], direction: SortByDirection) => TData[];
  sortable?: boolean;
};
