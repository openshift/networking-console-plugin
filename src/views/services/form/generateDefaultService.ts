import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';

export const generateDefaultService = (namespace: string): IoK8sApiCoreV1Service => ({
  apiVersion: ServiceModel.apiVersion,
  kind: ServiceModel.kind,
  metadata: {
    name: 'example',
    namespace,
  },
  spec: {
    ports: [
      {
        port: 80,
        protocol: 'TCP',
        targetPort: 9376 as unknown as string,
      },
    ],
    selector: {
      app: 'MyApp',
    },
    type: 'ClusterIP',
  },
});
