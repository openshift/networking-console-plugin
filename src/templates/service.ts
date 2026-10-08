import { ServiceModel } from '@utils/models';

export const ServiceYAMLTemplates = `
apiVersion: ${ServiceModel.apiVersion}
kind: ${ServiceModel.kind}
metadata:
  name: example
spec:
  selector:
    app: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376

`;
