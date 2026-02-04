import { RowFilter } from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModel, UserDefinedNetworkModel } from '@utils/models';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

const useUDNFilters = (): RowFilter<ClusterUserDefinedNetworkKind | UserDefinedNetworkKind>[] => {
  const { t } = useNetworkingTranslation();

  return [
    {
      filter: ({ selected }, obj) => {
        if (selected?.length === 0) return true;

        if (selected.includes('cudn') && obj.kind === ClusterUserDefinedNetworkModel.kind)
          return true;
        if (selected.includes('udn') && obj.kind === UserDefinedNetworkModel.kind) return true;

        return false;
      },
      filterGroupName: t('Kind'),
      items: [
        {
          id: 'cudn',
          title: t('Cluster-wide UserDefinedNetworks'),
        },
        {
          id: 'udn',
          title: t('Namespaced UserDefinedNetworks'),
        },
      ],
      reducer: (obj) => (obj.kind === ClusterUserDefinedNetworkModel.kind ? 'cudn' : 'udn'),
      type: 'udn-kind',
    },
  ];
};

export default useUDNFilters;
