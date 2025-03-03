import React, { FC, useState } from 'react';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import classNames from 'classnames';

import { Tooltip } from '@patternfly/react-core';
import { CopyIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type ExternalLinkWithCopyProps = {
  additionalClassName?: string;
  dataTestID?: string;
  link: string;
  text?: string;
};

export const ExternalLinkWithCopy: FC<ExternalLinkWithCopyProps> = ({
  additionalClassName,
  dataTestID,
  link,
  text,
}) => {
  const { t } = useNetworkingTranslation();
  const [copied, setCopied] = useState(false);

  const tooltipText = copied ? t('Copied to clipboard') : t('Copy to clipboard');
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];

  return (
    <div className={classNames(additionalClassName)}>
      <a data-test-id={dataTestID} href={link} rel="noopener noreferrer" target="_blank">
        {text ?? link}
        <span className="co-icon-nowrap">
          &nbsp;
          <span className="co-external-link-with-copy__icon co-external-link-with-copy__externallinkicon">
            <ExternalLinkAltIcon />
          </span>
        </span>
      </a>
      <span className="co-icon-nowrap">
        <Tooltip content={tooltipContent} exitDelay={1250} trigger="click mouseenter focus">
          <CTC onCopy={() => setCopied(true)} text={link}>
            <span
              className="co-external-link-with-copy__icon co-external-link-with-copy__copyicon"
              onMouseEnter={() => setCopied(false)}
            >
              <CopyIcon />
              <span className="pf-v6-u-screen-reader">{t('Copy to clipboard')}</span>
            </span>
          </CTC>
        </Tooltip>
      </span>
    </div>
  );
};
