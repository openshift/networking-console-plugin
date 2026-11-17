import { TFunction } from 'i18next';

import { TOPOLOGY_SCOPE_ORDER, TopologyViewTypes } from '@views/topology/utils/constants';

export const SCOPE_DEFINITIONS: { id: TopologyViewTypes }[] = TOPOLOGY_SCOPE_ORDER.map((id) => ({
  id,
}));

export const getScopeLabel = (t: TFunction, scope: TopologyViewTypes): string => {
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

export const getScopeDescription = (t: TFunction, scope: TopologyViewTypes): string => {
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
