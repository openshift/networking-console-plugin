import React, { FC, MouseEvent, useState } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  K8sResourceCommon,
  MatchExpression,
  Operator,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { ExpandableSection, List, ListItem } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { verifyMatchExpressions } from '@utils/utils';

type UDNNamespaceSelectorPreviewProps = {
  loaded: boolean;
  matchExpressions?: MatchExpression[];
  matchLabels?: Record<string, string>;
  namespaces?: K8sResourceCommon[];
};

const UDNNamespaceSelectorPreview: FC<UDNNamespaceSelectorPreviewProps> = ({
  loaded,
  matchExpressions = [],
  matchLabels = {},
  namespaces = [],
}) => {
  const { t } = useNetworkingTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const matchLabelExpressions: MatchExpression[] = Object.entries(matchLabels).map(
    ([key, value]) => ({
      key,
      operator: Operator.Equals,
      values: [value],
    }),
  );
  const matchingNamespaces = namespaces.filter((namespace) =>
    verifyMatchExpressions(namespace, [...matchLabelExpressions, ...matchExpressions]),
  );

  const onToggle = (_event: MouseEvent, expanded: boolean) => {
    setIsExpanded(expanded);
  };

  return (
    <ExpandableSection
      isExpanded={isExpanded}
      onToggle={onToggle}
      toggleText={isExpanded ? t('Hide selected Namespace(s)') : t('Review selected Namespace(s)')}
    >
      {!loaded ? (
        <Loading />
      ) : (
        <List isPlain>
          {matchingNamespaces.map((namespace) => (
            <ListItem key={getName(namespace)}>
              <ResourceLink
                groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
                name={getName(namespace)}
              />
            </ListItem>
          ))}
          {matchingNamespaces.length === 0 && t('No matching namespaces')}
        </List>
      )}
    </ExpandableSection>
  );
};

export default UDNNamespaceSelectorPreview;
