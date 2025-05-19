import React, { FC } from 'react';
import classNames from 'classnames';

import { K8sGroupVersionKind } from '@openshift-console/dynamic-plugin-sdk';
import { Label as PfLabel, LabelGroup as PfLabelGroup } from '@patternfly/react-core';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

export type LabelProps = {
  expand: boolean;
  groupVersionKind: K8sGroupVersionKind;
  name: string;
  value: string;
};

export const Label: FC<LabelProps> = ({ expand, groupVersionKind, name, value }) => {
  const href = `/search?kind=${groupVersionKind.kind}&q=${
    value ? encodeURIComponent(`${name}=${value}`) : name
  }`;
  const kindOf = `co-m-${groupVersionKind.kind.toLowerCase()}`;
  const labelClass = classNames(kindOf, { 'co-m-expand': expand }, 'co-label');

  return (
    <PfLabel className={labelClass} href={href}>
      <span className="co-label__key" data-test="label-key">
        {name}
      </span>
      {value && <span className="co-label__eq">=</span>}
      {value && <span className="co-label__value">{value}</span>}
    </PfLabel>
  );
};

type LabelListProps = {
  expand?: boolean;
  groupVersionKind: K8sGroupVersionKind;
  labels: { [key: string]: string };
};

export const LabelList: FC<LabelListProps> = ({ expand = true, groupVersionKind, labels }) => {
  const { t } = useNetworkingTranslation();

  const list = Object.entries(labels || []).map(([key, label]) => (
    <Label expand={expand} groupVersionKind={groupVersionKind} key={key} name={key} value={label} />
  ));

  return (
    <>
      {isEmpty(list) ? (
        <MutedText content={t('No labels')} key="0">
          {t('No labels')}
        </MutedText>
      ) : (
        <PfLabelGroup
          className="co-label-group"
          data-test="label-list"
          defaultIsOpen={true}
          numLabels={20}
        >
          {list}
        </PfLabelGroup>
      )}
    </>
  );
};
