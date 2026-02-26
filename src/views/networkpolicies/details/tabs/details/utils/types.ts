import { NetworkPolicyPeer } from '@utils/resources/networkpolicies/types';

export type ConsolidatedRow = {
  ipBlocks?: IPBlock[];
} & Omit<NetworkPolicyPeer, 'ipBlock'>;

export type IPBlock = {
  cidr: string;
  except?: string[];
};
