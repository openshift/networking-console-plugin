import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

import {
  K8sResourceCommon,
  MatchExpression,
  MatchLabels,
  Operator,
} from '@openshift-console/dynamic-plugin-sdk';
import { ALL_NAMESPACES, ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { getLabels } from '@utils/resources/shared';

import { SYSTEM_NAMESPACES, SYSTEM_NAMESPACES_PREFIX } from './constants';

export const networkConsole = console;

export const isEmpty = (obj) =>
  [Array, Object].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;

export const generateName = (prefix: string): string => {
  return `${prefix}-${uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: '-',
  })}`;
};

export const createNamespacePath = (namespace: string) =>
  namespace ? `ns/${namespace}` : ALL_NAMESPACES;

export const getValidNamespace = (activeNamespace: string) =>
  activeNamespace === ALL_NAMESPACES_KEY ? DEFAULT_NAMESPACE : activeNamespace;

export const get = (obj: unknown, path: string | string[], defaultValue = undefined) => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res: { [x: string]: any }, key: number | string) => {
        return res !== null && res !== undefined ? res[key] : res;
      }, obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

export const isString = (val: unknown) => val !== null && typeof val === 'string';

export const isEqualObject = (object, otherObject) => {
  if (object === otherObject) {
    return true;
  }

  if (object === null || otherObject === null) {
    return false;
  }

  if (object?.constructor !== otherObject?.constructor) {
    return false;
  }

  if (typeof object !== 'object') {
    return false;
  }

  const objectKeys = Object.keys(object);
  const otherObjectKeys = Object.keys(otherObject);

  if (objectKeys.length !== otherObjectKeys.length) {
    return false;
  }

  for (const key of objectKeys) {
    if (!otherObjectKeys.includes(key) || !isEqualObject(object[key], otherObject[key])) {
      return false;
    }
  }

  return true;
};

export const match = (resource: K8sResourceCommon, matchLabels: MatchLabels) =>
  Object.entries(matchLabels || {})?.every(
    ([key, value]) => resource?.metadata?.labels?.[key] === value,
  );

export const verifyMatchExpressions = (
  resource: K8sResourceCommon,
  matchExpressions: MatchExpression[],
): boolean =>
  matchExpressions?.every((expr) => {
    switch (expr.operator) {
      case Operator.Exists:
        return getLabels(resource)?.[expr.key] !== undefined;
      case Operator.DoesNotExist:
        return getLabels(resource)?.[expr.key] === undefined;
      case Operator.GreaterThan:
        return parseInt(getLabels(resource)?.[expr.key], 10) > parseInt(expr?.values[0], 10);
      case Operator.LessThan:
        return parseInt(getLabels(resource)?.[expr.key], 10) < parseInt(expr?.values[0], 10);
      case Operator.Equals:
        return getLabels(resource)?.[expr.key] === expr?.values[0];
      case Operator.NotEquals:
      case Operator.NotEqual:
        return getLabels(resource)?.[expr.key] !== expr?.values[0];
      case Operator.In:
        return expr.values.includes(getLabels(resource)?.[expr.key]);
      case Operator.NotIn:
        return !expr.values.includes(getLabels(resource)?.[expr.key]);
      default:
        return false;
    }
  });

export const isSystemNamespace = (projectName: string) => {
  const startsWithNamespace = SYSTEM_NAMESPACES_PREFIX.some((ns) => projectName.startsWith(ns));
  const isNamespace = SYSTEM_NAMESPACES.includes(projectName);

  return startsWithNamespace || isNamespace;
};
