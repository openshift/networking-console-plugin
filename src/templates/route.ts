import { RouteModel } from '@kubevirt-ui-ext/kubevirt-api/console';

export const RouteYAMLTemplates = `
apiVersion: ${RouteModel.apiGroup}/${RouteModel.apiVersion}
kind: ${RouteModel.kind}
metadata:
  name: example
spec:
  path: /
  to:
    kind: Service
    name: example
  port:
    targetPort: 80
`;
