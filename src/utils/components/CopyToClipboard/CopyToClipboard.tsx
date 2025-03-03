import React, { FC, memo, ReactNode, useState } from 'react';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import * as _ from 'lodash';

import { Button, CodeBlock, CodeBlockAction, CodeBlockCode, Tooltip } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

export type CopyToClipboardProps = {
  value: string;
  visibleValue?: ReactNode;
};

export const CopyToClipboard: FC<CopyToClipboardProps> = memo((props) => {
  const { t } = useNetworkingTranslation();
  const [copied, setCopied] = useState(false);

  const tooltipText = copied ? t('Copied') : t('Copy to clipboard');
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];

  // Default to value if no visible value was specified.
  const visibleValue = _.isNil(props.visibleValue) ? props.value : props.visibleValue;

  const actions = (
    <CodeBlockAction>
      <Tooltip content={tooltipContent} exitDelay={1250} trigger="click mouseenter focus">
        <CTC onCopy={() => setCopied(true)} text={props.value}>
          <Button
            icon={
              <>
                <CopyIcon />
                <span className="pf-v6-u-screen-reader">{t('Copy to clipboard')}</span>
              </>
            }
            className="co-copy-to-clipboard__btn"
            onMouseEnter={() => setCopied(false)}
            type="button"
            variant="plain"
          />
        </CTC>
      </Tooltip>
    </CodeBlockAction>
  );

  return (
    <CodeBlock actions={actions} className="co-copy-to-clipboard">
      <CodeBlockCode
        className="co-copy-to-clipboard__text"
        codeClassName="co-copy-to-clipboard__code"
        data-test="copy-to-clipboard"
      >
        {visibleValue}
      </CodeBlockCode>
    </CodeBlock>
  );
});
