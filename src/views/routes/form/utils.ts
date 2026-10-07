import { RouteModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { RouteKind, RouteTLS } from '@utils/types';
import { generateName } from '@utils/utils';

import { EDGE, PASSTHROUGH } from './constants';

export const generateDefaultRoute = (namespace: string): RouteKind => ({
  apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
  kind: RouteModel.kind,
  metadata: {
    name: generateName('route'),
    namespace,
  },
  spec: {
    to: {
      kind: 'Service',
      name: '',
    },
  },
});

export const omitCertificatesOnTypeChange = (routeTLS: RouteTLS, terminationType: string) => {
  if (terminationType === EDGE) {
    return {
      caCertificate: routeTLS.caCertificate,
      certificate: routeTLS.certificate,
      insecureEdgeTerminationPolicy: routeTLS.insecureEdgeTerminationPolicy,
      key: routeTLS.key,
      termination: routeTLS.termination,
    };
  }

  if (terminationType === PASSTHROUGH) {
    return {
      insecureEdgeTerminationPolicy: routeTLS.insecureEdgeTerminationPolicy,
      key: routeTLS.key,
      termination: routeTLS.termination,
    };
  }

  return routeTLS;
};
