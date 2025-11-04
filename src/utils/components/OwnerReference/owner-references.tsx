import React, { FC } from 'react';
import * as _ from 'lodash-es';

import {
  K8sResourceKind,
  OwnerReference,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { referenceForOwnerRef } from './utils';

export const OwnerReferences: FC<OwnerReferencesProps> = ({ resource }) => {
  const { t } = useNetworkingTranslation();
  const owners = (_.get(resource.metadata, 'ownerReferences') || []).map((o: OwnerReference) => (
    <ResourceLink
      key={o.uid}
      kind={referenceForOwnerRef(o)}
      name={o.name}
      namespace={resource.metadata.namespace}
    />
  ));
  return owners.length ? (
    <>{owners}</>
  ) : (
    <span className="pf-v6-u-text-color-subtle">{t('No owner')}</span>
  );
};

type OwnerReferencesProps = {
  resource: K8sResourceKind;
};

OwnerReferences.displayName = 'OwnerReferences';
