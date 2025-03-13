import React, { ChangeEvent, FC } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button, ButtonVariant, Content, InputGroup, TextInput } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useClusterNetworkFeatures } from '@utils/hooks/useClusterNetworkFeatures';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicyIPBlock } from '@utils/models';

import { NetworkPolicyEgressIngress } from './utils/types';

type NetworkPolicyPeerIPBlockProps = {
  direction: NetworkPolicyEgressIngress;
  ipBlock: NetworkPolicyIPBlock;
  onChange: (ipBlock: NetworkPolicyIPBlock) => void;
};

const NetworkPolicyPeerIPBlock: FC<NetworkPolicyPeerIPBlockProps> = ({
  direction,
  ipBlock,
  onChange,
}) => {
  const { t } = useNetworkingTranslation();
  const [networkFeatures, networkFeaturesLoaded] = useClusterNetworkFeatures();

  const handleCIDRChange = (event: ChangeEvent<HTMLInputElement>) => {
    ipBlock.cidr = event.currentTarget.value;
    onChange(ipBlock);
  };

  const handleExceptionsChange = (idx: number, value: string) => {
    ipBlock.except[idx].value = value;
    onChange(ipBlock);
  };

  return (
    <>
      <div>
        <label className="co-required" htmlFor="cidr">
          {t('CIDR')}
        </label>
        <TextInput
          aria-describedby="ipblock-help"
          data-test="ipblock-cidr-input"
          id="cidr"
          name="cidr"
          onChange={handleCIDRChange}
          placeholder="10.2.1.0/16"
          required
          value={ipBlock.cidr}
        />
        <div className="help-block">
          <Content component="p">
            {direction === 'ingress'
              ? t('If this field is empty, traffic will be allowed from all external sources.')
              : t('If this field is empty, traffic will be allowed to all external sources.')}
          </Content>
        </div>
      </div>
      {networkFeaturesLoaded && networkFeatures?.PolicyPeerIPBlockExceptions !== false && (
        <div className="form-group">
          <label>{t('Exceptions')}</label>
          {ipBlock?.except?.map((exc, idx) => (
            <InputGroup key={exc.key} className="pf-v6-u-mt-sm">
              <TextInput
                aria-describedby="ports-help"
                data-test="ipblock-exception-input"
                id={`exception-${idx}`}
                name={`exception-${idx}`}
                onChange={(event) => handleExceptionsChange(idx, event.currentTarget.value)}
                placeholder="10.2.1.0/12"
                value={exc.value}
              />
              <Button
                icon={<MinusCircleIcon />}
                aria-label={t('Remove exception')}
                className="co-create-networkpolicy__remove-exception"
                data-test="ipblock-remove-exception"
                onClick={() => {
                  ipBlock.except = [
                    ...ipBlock.except.slice(0, idx),
                    ...ipBlock.except.slice(idx + 1),
                  ];
                  onChange(ipBlock);
                }}
                type="button"
                variant="plain"
              />
            </InputGroup>
          ))}
          <div className="co-toolbar__group co-toolbar__group--left pf-v6-u-mt-sm">
            <Button
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              className="pf-m-link--align-left"
              data-test="ipblock-add-exception"
              onClick={() => {
                ipBlock.except.push({
                  key: uuidv4(),
                  value: '',
                });
                onChange(ipBlock);
              }}
              type="button"
              variant={ButtonVariant.link}
            >
              {t('Add exception')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkPolicyPeerIPBlock;
