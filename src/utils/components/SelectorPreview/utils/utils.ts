import { K8sModel, K8sResourceCommon, Selector } from '@openshift-console/dynamic-plugin-sdk';
import { t } from '@utils/hooks/useNetworkingTranslation';
import { selectorToK8s } from '@utils/models';
import { resourcePathFromModel } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

import {
  allowedSelector,
  filterTypeMap,
  labelFilterQueryParamSeparator,
  maxPreviewResources,
} from './const';

export const resourceListPathFromModel = (model: K8sModel, namespace?: string) =>
  resourcePathFromModel(model, null, namespace);

export const safeSelector = (selector?: string[][]): [Selector, string?] => {
  if (!selector || selector?.length === 0) {
    return [{ matchLabels: {} }, undefined];
  }
  for (const label of selector) {
    if (!label[0].match(allowedSelector)) {
      return [{ matchLabels: {} }, label[0]];
    }
    if (!label[1].match(allowedSelector)) {
      return [{ matchLabels: {} }, label[1]];
    }
  }
  return [selectorToK8s(selector) as Selector, undefined];
};

export const matchedNamespaces = (watchedNs: K8sResourceCommon[]) => {
  const set = new Set<string>();
  for (const ns of watchedNs) {
    const name = ns.metadata?.name;
    if (name && !set.has(name)) {
      set.add(name);
    }
  }

  return set;
};

export const selectorError = (offendingSelector: string) => {
  if (offendingSelector) {
    return t(
      'Input error: selectors must start and end by a letter ' +
        'or number, and can only contain -, _, / or . ' +
        'Offending value: {{offendingSelector}}',
      {
        offendingSelector,
      },
    );
  }
  return undefined;
};

export const labelsFilterQuery = (total: number, labelList: string[]) => {
  if (total > maxPreviewResources && !isEmpty(labelList)) {
    return `?${filterTypeMap.Label}=${encodeURIComponent(
      labelList.join(labelFilterQueryParamSeparator),
    )}`;
  }
  return '';
};

export const labelPairsToRecord = (pairs: string[][]): Record<string, string> => {
  const record: Record<string, string> = {};

  for (const [key, value] of pairs) {
    const trimmedKey = key?.trim() ?? '';
    const trimmedValue = value?.trim() ?? '';

    if (!trimmedKey && !trimmedValue) {
      continue;
    }

    if (!trimmedKey) {
      throw new Error('Selector pair is missing a key');
    }

    record[trimmedKey] = trimmedValue;
  }

  return record;
};

export const recordToLabelPairs = (labels: Record<string, string> = {}): string[][] => {
  const pairs = Object.entries(labels);
  return pairs.length ? pairs : [['', '']];
};
