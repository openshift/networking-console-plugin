import React, { ComponentType, FC } from 'react';
import { IconType } from 'react-icons';
import { GrMultiple } from 'react-icons/gr';
import { LuGroup } from 'react-icons/lu';
import { PiNetwork } from 'react-icons/pi';

import TopologyOwnerIcon from './TopologyOwnerIcon';

type TopologyScopeIconProps = {
  height?: number;
  kind?: string;
  scope: string;
  width?: number;
};

const ICONS: Record<string, IconType> = {
  namespace: LuGroup,
  network: PiNetwork,
  owner: GrMultiple,
  resource: GrMultiple,
};

const TopologyScopeIcon: FC<TopologyScopeIconProps> = ({ height, kind, scope, width }) => {
  const normalizedKind = kind?.toLowerCase();
  if (
    scope === 'owner' &&
    (normalizedKind === 'userdefinednetwork' || normalizedKind === 'clusteruserdefinednetwork')
  ) {
    const NetworkIcon = ICONS.network;
    const size = Math.min(height ?? 30, width ?? 30);
    return <NetworkIcon aria-hidden size={size} />;
  }
  if (scope === 'owner') return <TopologyOwnerIcon height={height} kind={kind} width={width} />;
  const Icon = ICONS[scope] ?? GrMultiple;
  const size = Math.min(height ?? 30, width ?? 30);

  return <Icon aria-hidden size={size} />;
};

export const createScopeIcon =
  (scope: string, kind?: string): ComponentType =>
  () => <TopologyScopeIcon height={30} kind={kind} scope={scope} width={30} />;

export default TopologyScopeIcon;
