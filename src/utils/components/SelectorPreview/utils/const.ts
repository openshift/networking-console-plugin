import { FilterType } from './types';

export const filterTypeMap = {
  [FilterType.LABEL]: 'labels',
  [FilterType.NAME]: 'name',
};

export const maxPreviewResources = 10;
export const labelFilterQueryParamSeparator = ',';
export const allowedSelector = /^([A-Za-z0-9][-A-Za-z0-9_/.]*)?[A-Za-z0-9]$/;
