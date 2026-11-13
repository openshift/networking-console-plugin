import { TFunction } from 'i18next';

import { TopologyGroupType } from '@views/topology/types';
import { TopologyLayoutType, TopologyViewTypes } from '@views/topology/utils/constants';

export const getDisplayOptionLabel = (
  t: TFunction,
  value: TopologyGroupType | TopologyViewTypes,
): string => {
  switch (value) {
    case TopologyViewTypes.network:
      return t('Network');
    case TopologyViewTypes.owner:
      return t('Owner');
    case TopologyViewTypes.namespace:
      return t('Namespace');
    case TopologyViewTypes.resource:
      return t('Resource');
    case TopologyGroupType.namespaceOwner:
      return t('Namespace + Owner');
    case TopologyGroupType.none:
      return t('None');
    default:
      return t('Display options');
  }
};

export type LayoutOption = {
  description: string;
  label: string;
  type: TopologyLayoutType;
};
