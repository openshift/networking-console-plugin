import { k8sPatch, Operator } from '@openshift-console/dynamic-plugin-sdk';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { PROJECT_NAME_LABEL_KEY } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

export const patchClusterUDN = async (
  clusterUDN: ClusterUserDefinedNetworkKind,
  projectName: string,
) => {
  const projectMatchExpressionIndex =
    clusterUDN?.spec?.namespaceSelector?.matchExpressions?.findIndex(
      (expression) => expression.key === PROJECT_NAME_LABEL_KEY,
    );

  const currentUDNProjects =
    clusterUDN?.spec?.namespaceSelector?.matchExpressions?.[projectMatchExpressionIndex]?.values;

  const patchMatchExpression =
    projectMatchExpressionIndex === -1
      ? [
          { op: 'add', path: '/spec/namespaceSelector/matchExpressions', value: [] },
          {
            op: 'add',
            path: `/spec/namespaceSelector/matchExpressions/`,
            value: {
              key: PROJECT_NAME_LABEL_KEY,
              operator: Operator.In,
              values: [projectName],
            },
          },
        ]
      : [
          {
            op: 'replace',
            path: `/spec/namespaceSelector/matchExpressions/${projectMatchExpressionIndex}/values`,
            value: [...currentUDNProjects, projectName],
          },
        ];

  await k8sPatch({
    data: patchMatchExpression,
    model: ClusterUserDefinedNetworkModel,
    resource: clusterUDN,
  });
};
