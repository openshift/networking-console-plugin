import { UserDefinedNetworkModel } from '@utils/resources/udns/utils';

export const UserDefinedNetworksYAMLTemplates = `
apiVersion: ${UserDefinedNetworkModel.apiGroup}/${UserDefinedNetworkModel.apiVersion}
kind: ${UserDefinedNetworkModel.kind}
metadata:
  name: udn-1
  namespace: <some_custom_namespace>
spec:
  topology: Layer2 
  layer2: 
    role: Primary 
    subnets:
      - "10.0.0.0/24"
      - "2001:db8::/60" 
`;
