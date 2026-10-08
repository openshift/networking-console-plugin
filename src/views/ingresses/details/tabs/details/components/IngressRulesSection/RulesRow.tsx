import React, { FC } from 'react';

import { getGroupVersionKindForModel, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Td, Tr } from '@patternfly/react-table';
import { ServiceModel } from '@utils/models';
import { IngressPathRule } from '@views/ingresses/details/tabs/details/utils/types';

type RulesRowProps = {
  namespace: string;
  rule: IngressPathRule;
};

const RulesRow: FC<RulesRowProps> = ({ namespace, rule }) => {
  return (
    <Tr>
      <Td className="co-break-word">{rule?.host}</Td>
      <Td className="co-break-word">{rule?.path}</Td>
      <Td className="co-break-word" visibility={['hidden', 'visibleOnMd']}>
        {rule?.pathType}
      </Td>
      <Td visibility={['hidden', 'visibleOnSm']}>
        {rule?.serviceName ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
            name={rule?.serviceName}
            namespace={namespace}
          />
        ) : (
          '-'
        )}
      </Td>
      <Td visibility={['hidden', 'visibleOnMd']}>{rule?.servicePort || '-'}</Td>
    </Tr>
  );
};

export default RulesRow;
