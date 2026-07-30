import { K8sResourceCommon, Selector } from '@openshift-console/dynamic-plugin-sdk';
import { t } from '@utils/hooks/useNetworkingTranslation';
import { selectorToK8s } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { isEmpty } from '@utils/utils';

export const ALLOWED_SELECTOR = /^([A-Za-z0-9][-A-Za-z0-9_/.]*)?[A-Za-z0-9]$/;
export const LABEL_FILTER_QUERY_PARAM_SEPARATOR = ',';
export const MAX_PREVIEW_RESOURCES = 10;

export const safeSelector = (selector?: string[][]): [Selector, string?] => {
  if (!selector || selector?.length === 0) {
    return [{ matchLabels: {} }, undefined];
  }
  for (const label of selector) {
    if (!label[0].match(ALLOWED_SELECTOR)) {
      return [{ matchLabels: {} }, label[0]];
    }
    if (!label[1].match(ALLOWED_SELECTOR)) {
      return [{ matchLabels: {} }, label[1]];
    }
  }
  return [selectorToK8s(selector) as Selector, undefined];
};

export const matchedNamespaces = (watchedNs: K8sResourceCommon[]) => {
  const set = new Set<string>();
  for (const ns of watchedNs) {
    const name = getName(ns);
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

export const labelsFilterQuery = (
  total: number,
  labelList: string[],
  maxPreview = MAX_PREVIEW_RESOURCES,
) => {
  if (total > maxPreview && !isEmpty(labelList)) {
    return `?labels=${encodeURIComponent(labelList.join(LABEL_FILTER_QUERY_PARAM_SEPARATOR))}`;
  }
  return '';
};
