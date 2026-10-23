import { IngressModel } from '@utils/models';

export const IngressYAMLTemplates = `
apiVersion: ${IngressModel.apiGroup}/${IngressModel.apiVersion}
kind: ${IngressModel.kind}
metadata:
  name: example
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /testpath
            pathType: Prefix
            backend:
              service:
                name: test
                port:
                  number: 80
`;
