import { k8sPatch, Operator } from '@openshift-console/dynamic-plugin-sdk';
import { ClusterUserDefinedNetworkModel } from '@utils/models';
import { PROJECT_NAME_LABEL_KEY } from '@utils/resources/udns/constants';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

type JsonPatchOp = { op: string; path: string; value?: unknown };

/* Adds a project to a ClusterUserDefinedNetwork's namespace selector.
 *
 * The shape of the selector decides the patch: adding an array over an existing
 * one would replace it and drop every other match expression, so an existing
 * array is appended to (`/-`) and only a missing container is created. */
export const patchClusterUDN = async (
  clusterUDN: ClusterUserDefinedNetworkKind,
  projectName: string,
) => {
  const selector = clusterUDN?.spec?.namespaceSelector;
  const matchExpressions = selector?.matchExpressions;
  const projectMatchExpressionIndex =
    matchExpressions?.findIndex((expression) => expression.key === PROJECT_NAME_LABEL_KEY) ?? -1;

  const projectMatchExpression = {
    key: PROJECT_NAME_LABEL_KEY,
    operator: Operator.In,
    values: [projectName],
  };

  let patchMatchExpression: JsonPatchOp[];

  if (!selector) {
    patchMatchExpression = [
      {
        op: 'add',
        path: '/spec/namespaceSelector',
        value: { matchExpressions: [projectMatchExpression] },
      },
    ];
  } else if (!matchExpressions) {
    patchMatchExpression = [
      {
        op: 'add',
        path: '/spec/namespaceSelector/matchExpressions',
        value: [projectMatchExpression],
      },
    ];
  } else if (projectMatchExpressionIndex === -1) {
    // `-` appends without touching the expressions already in the array.
    patchMatchExpression = [
      {
        op: 'add',
        path: '/spec/namespaceSelector/matchExpressions/-',
        value: projectMatchExpression,
      },
    ];
  } else {
    const currentProjects = matchExpressions[projectMatchExpressionIndex]?.values ?? [];

    patchMatchExpression = [
      {
        op: 'replace',
        path: `/spec/namespaceSelector/matchExpressions/${projectMatchExpressionIndex}/values`,
        value: [...currentProjects, projectName],
      },
    ];
  }

  await k8sPatch({
    data: patchMatchExpression,
    model: ClusterUserDefinedNetworkModel,
    resource: clusterUDN,
  });
};
