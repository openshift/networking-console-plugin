import React, { FC, useState } from 'react';

import { Button, ButtonVariant, Content } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import LabelSelectorEditor from '@utils/components/LabelSelectorEditor/LabelSelectorEditor';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

type NetworkPolicyConditionalSelectorProps = {
  dataTest?: string;
  helpText: string;
  onChange: (pairs: string[][]) => void;
  selectorType: 'namespace' | 'pod';
  values: string[][];
};

const NetworkPolicyConditionalSelector: FC<NetworkPolicyConditionalSelectorProps> = ({
  dataTest,
  helpText,
  onChange,
  selectorType,
  values,
}) => {
  const { t } = useNetworkingTranslation();
  const [isVisible, setVisible] = useState<boolean>(isEmpty(values));

  const handleSelectorChange = (nameValuePairs: string[][]) => {
    onChange(nameValuePairs);
  };

  const title = selectorType === 'pod' ? t('Pod selector') : t('Namespace selector');
  const addSelectorText =
    selectorType === 'pod' ? t('Add pod selector') : t('Add namespace selector');
  const secondHelpText =
    selectorType === 'pod'
      ? t('Pods having all the supplied key/value pairs as labels will be selected.')
      : t('Namespaces having all the supplied key/value pairs as labels will be selected.');

  return (
    <>
      <span>
        <label>{title}</label>
      </span>
      <Content component="p">{helpText}</Content>
      {isVisible || !isEmpty(values) ? (
        <>
          <Content component="p">{secondHelpText}</Content>
          <LabelSelectorEditor
            labelSelectorPairs={!isEmpty(values) ? values : [['', '']]}
            onLastItemRemoved={() => setVisible(false)}
            updateParentData={handleSelectorChange}
          />
        </>
      ) : (
        <Button
          className="pf-m-link--align-left"
          data-test={dataTest ? `add-${dataTest}` : 'add-labels-selector'}
          icon={<PlusCircleIcon className="co-icon-space-r" />}
          onClick={() => setVisible(true)}
          variant={ButtonVariant.link}
        >
          {addSelectorText}
        </Button>
      )}
    </>
  );
};

export default NetworkPolicyConditionalSelector;
