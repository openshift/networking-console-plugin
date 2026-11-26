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
  t: (key: string, opts?: unknown) => string,
) => {
  const selector = clusterUDN?.spec?.namespaceSelector;
  const matchExpressions = selector?.matchExpressions;
  const matchLabels = selector?.matchLabels as Record<string, string> | undefined;

  // Reject narrowing selectors: matchLabels or matchExpressions with a non-name key
  // would be ANDed with a name-based In, silently dropping already-selected namespaces.
  const nonNameLabel = matchLabels
    ? Object.keys(matchLabels).find((k) => k !== PROJECT_NAME_LABEL_KEY)
    : undefined;
  if (nonNameLabel) {
    throw new Error(
      t(
        'ClusterUserDefinedNetwork selector contains unsupported {{labelType}} key {{offendingKey}}; adding {{project}} would narrow the selector',
        { labelType: 'matchLabels', offendingKey: nonNameLabel, project: projectName },
      ),
    );
  }
  const nonNameExpr = matchExpressions?.find((e) => e.key !== PROJECT_NAME_LABEL_KEY);
  if (nonNameExpr) {
    throw new Error(
      t(
        'ClusterUserDefinedNetwork selector contains unsupported {{labelType}} key {{offendingKey}}; adding {{project}} would narrow the selector',
        { labelType: 'matchExpressions', offendingKey: nonNameExpr.key, project: projectName },
      ),
    );
  }

  const migratedFromLabels = matchLabels?.[PROJECT_NAME_LABEL_KEY];

  const projectMatchExpressionIndex =
    matchExpressions?.findIndex(
      (expression) =>
        expression.key === PROJECT_NAME_LABEL_KEY && expression.operator === Operator.In,
    ) ?? -1;

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
    if (migratedFromLabels) {
      const values =
        migratedFromLabels === projectName ? [projectName] : [migratedFromLabels, projectName];
      patchMatchExpression = [
        {
          op: 'remove',
          path:
            '/spec/namespaceSelector/matchLabels/' +
            PROJECT_NAME_LABEL_KEY.replace(/~/g, '~0').replace(/\//g, '~1'),
        },
        {
          op: 'add',
          path: '/spec/namespaceSelector/matchExpressions',
          value: [{ key: PROJECT_NAME_LABEL_KEY, operator: Operator.In, values }],
        },
      ];
    } else {
      patchMatchExpression = [
        {
          op: 'add',
          path: '/spec/namespaceSelector/matchExpressions',
          value: [projectMatchExpression],
        },
      ];
    }
  } else if (projectMatchExpressionIndex === -1) {
    if (migratedFromLabels) {
      const values =
        migratedFromLabels === projectName ? [projectName] : [migratedFromLabels, projectName];
      patchMatchExpression = [
        {
          op: 'remove',
          path:
            '/spec/namespaceSelector/matchLabels/' +
            PROJECT_NAME_LABEL_KEY.replace(/~/g, '~0').replace(/\//g, '~1'),
        },
        {
          op: 'add',
          path: '/spec/namespaceSelector/matchExpressions/-',
          value: { key: PROJECT_NAME_LABEL_KEY, operator: Operator.In, values },
        },
      ];
    } else {
      // `-` appends without touching the expressions already in the array.
      patchMatchExpression = [
        {
          op: 'add',
          path: '/spec/namespaceSelector/matchExpressions/-',
          value: projectMatchExpression,
        },
      ];
    }
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
