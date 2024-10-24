import { UserDefinedNetworkKind } from '../types';

export const getType = (udn: UserDefinedNetworkKind): string => {
  return udn?.spec?.topology || null;
};

export const getDescription = (udn: UserDefinedNetworkKind): string => {
  return udn?.metadata?.annotations?.description;
};
