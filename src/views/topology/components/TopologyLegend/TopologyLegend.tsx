import React, { FC, useMemo } from 'react';

import { Model } from '@patternfly/react-topology';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RelationshipType } from '@views/topology/utils/constants';

import './TopologyLegend.scss';

type TopologyLegendProps = {
  model?: Model;
};

type LegendEntry = {
  badge: string;
  color: string;
  kind: string;
};

const TopologyLegend: FC<TopologyLegendProps> = ({ model }) => {
  const { t } = useNetworkingTranslation();
  const entries = useMemo(() => {
    const uniqueEntries = new Map<string, LegendEntry>();

    model?.nodes?.forEach((node) => {
      const badge = node.data?.badge as string | undefined;
      const color = node.data?.badgeColor as string | undefined;
      const kind = node.data?.badgeKind as string | undefined;
      if (!badge || !color || !kind) return;
      uniqueEntries.set(`${kind}-${badge}`, { badge, color, kind });
    });

    return [...uniqueEntries.values()].sort((first, second) =>
      first.kind.localeCompare(second.kind),
    );
  }, [model]);

  const edgeEntries = useMemo(() => {
    const labels: Record<RelationshipType, string> = {
      [RelationshipType.CUDNToNAD]: t(
        'Cluster user-defined network to network attachment definition',
      ),
      [RelationshipType.CUDNToPod]: t('Cluster user-defined network to pod'),
      [RelationshipType.CUDNToVM]: t('Cluster user-defined network to virtual machine'),
      [RelationshipType.IngressToService]: t('Ingress to service'),
      [RelationshipType.MultiNetworkPolicyToNAD]: t(
        'Multi-network policy to network attachment definition',
      ),
      [RelationshipType.PodToNAD]: t('Pod to network attachment definition'),
      [RelationshipType.RouteToService]: t('Route to service'),
      [RelationshipType.Scope]: t('Aggregated connection'),
      [RelationshipType.UDNToNAD]: t('User-defined network to network attachment definition'),
      [RelationshipType.UDNToPod]: t('User-defined network to pod'),
      [RelationshipType.UDNToVM]: t('User-defined network to virtual machine'),
      [RelationshipType.VirtualMachineToNAD]: t('Virtual machine to network attachment definition'),
    };

    return [
      ...new Set(
        model?.edges
          ?.map((edge) => edge.data?.relationshipType as RelationshipType | undefined)
          .filter((relationship): relationship is RelationshipType => !!relationship),
      ),
    ].map((relationshipType) => ({
      label: labels[relationshipType],
      relationshipType,
    }));
  }, [model, t]);

  return (
    <div className="networking-topology__legend" role="list">
      {entries.map((entry) => (
        <div
          className="networking-topology__legend-entry"
          key={`${entry.kind}-${entry.badge}`}
          role="listitem"
        >
          <span
            className="networking-topology__legend-badge"
            style={{ backgroundColor: entry.color }}
          >
            {entry.badge}
          </span>
          <span>{entry.kind}</span>
        </div>
      ))}
      {edgeEntries.length > 0 && (
        <>
          <div className="networking-topology__legend-section-title">{t('Edges')}</div>
          {edgeEntries.map((entry) => (
            <div
              className="networking-topology__legend-entry"
              key={entry.relationshipType}
              role="listitem"
            >
              <span className="networking-topology__legend-edge" />
              <span>{entry.label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default TopologyLegend;
