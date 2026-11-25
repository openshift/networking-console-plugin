import React, { ReactNode } from 'react';
import { Link } from 'react-router';
import { TFunction } from 'i18next';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import { K8sResourceCommon, ResourceLink, Selector } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  DescriptionList as DL,
  Label,
  LabelGroup,
} from '@patternfly/react-core';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import Loading from '@utils/components/Loading/Loading';

export const selectorEntry = (key: string, value?: string) => (value ? `${key}=${value}` : key);

export const selectorOperator = (operator: string) => {
  switch (operator) {
    case 'In':
      return 'in';
    case 'NotIn':
      return 'notin';
    case 'Exists':
      return 'exists';
    case 'DoesNotExist':
      return 'does not exist';
    default:
      return operator;
  }
};

export const getSelectorEntries = (selector: Selector): ReactNode[] => [
  ...Object.entries(selector.matchLabels || {}).map(([key, value]) => (
    <Label color="blue" key={`label-${key}`} variant="outline">
      {selectorEntry(key, value)}
    </Label>
  )),
  ...(selector.matchExpressions || []).map((expression, index) => (
    <Label color="blue" key={`expression-${expression.key}-${index}`} variant="outline">
      {expression.key} {selectorOperator(expression.operator)} {expression.values?.join(', ')}
    </Label>
  )),
];

export const getSelectorContent = (
  namespaceListLink: string | undefined,
  selectorEntries: ReactNode[],
  t: TFunction,
): ReactNode => {
  if (!selectorEntries.length) return t('All namespaces');

  if (namespaceListLink) {
    return (
      <Link to={namespaceListLink}>
        <LabelGroup>{selectorEntries}</LabelGroup>
      </Link>
    );
  }

  return <LabelGroup>{selectorEntries}</LabelGroup>;
};

type MembershipContentProps = {
  cudn: K8sResourceCommon;
  matchingNamespaces: K8sResourceCommon[];
  namespacesError?: Error;
  namespacesLoaded: boolean;
  selectorEntries: ReactNode[];
  t: TFunction;
};

export const getMembershipContent = ({
  cudn,
  matchingNamespaces,
  namespacesError,
  namespacesLoaded,
  selectorEntries,
  t,
}: MembershipContentProps): ReactNode => {
  if (namespacesError) {
    return (
      <Alert
        isInline
        title={t('Unable to load matching namespaces')}
        variant={AlertVariant.warning}
      >
        {namespacesError.message || t('The namespace membership query could not be completed.')}
      </Alert>
    );
  }

  if (!namespacesLoaded) return <Loading />;

  if (matchingNamespaces.length) {
    return (
      <DL className="co-m-pane__details pf-v6-u-mt-md">
        <DetailsItem label={t('Namespaces')} obj={cudn}>
          <LabelGroup>
            {matchingNamespaces.map((namespace) => (
              <Label color="blue" key={namespace.metadata?.name} variant="outline">
                <ResourceLink
                  groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
                  name={namespace.metadata?.name}
                />
              </Label>
            ))}
          </LabelGroup>
        </DetailsItem>
      </DL>
    );
  }

  return (
    <Alert
      className="pf-v6-u-mt-md"
      isInline
      title={t('No namespaces match this selector')}
      variant={AlertVariant.warning}
    >
      {t(
        'Namespaces can be created before or after this network. Add the selector labels above to include them.',
      )}
      <p className="pf-v6-u-mb-0 pf-v6-u-mt-sm">
        {selectorEntries.length
          ? t(
              'Namespaces must satisfy all selector requirements, including labels that must be absent and alternative values.',
            )
          : t('This network has no namespace selector and can include all namespaces.')}
      </p>
    </Alert>
  );
};
