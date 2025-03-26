import React, { FC } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  Button,
  ButtonVariant,
  InputGroup,
  InputGroupItem,
  TextInput,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { convertPort, NetworkPolicyPort } from '@utils/models';

import PortsDropdown from '../NetworkPolicyPortsDropdown';

type NetworkPolicyPortsProps = {
  onChange: (ports: NetworkPolicyPort[]) => void;
  ports: NetworkPolicyPort[];
};
const NetworkPolicyPorts: FC<NetworkPolicyPortsProps> = (props) => {
  const { onChange, ports } = props;
  const { t } = useNetworkingTranslation();

  const onSingleChange = (port: NetworkPolicyPort, index: number) => {
    onChange([...ports.slice(0, index), port, ...ports.slice(index + 1)]);
  };

  const onRemove = (index: number) => {
    onChange([...ports.slice(0, index), ...ports.slice(index + 1)]);
  };

  return (
    <>
      {
        <div className="form-group co-create-networkpolicy__ports-list">
          <label>{t('Ports')}</label>
          <div className="help-block" id="ingress-peers-help">
            <p>
              {t(
                'Add ports to restrict traffic through them. If no ports are provided, your policy will make all ports accessible to traffic.',
              )}
            </p>
          </div>
          {ports.map((port, idx) => {
            const key = `${port}-${idx}`;
            return (
              <InputGroup className="pf-v6-u-mt-sm" key={key}>
                <InputGroupItem isFill>
                  <PortsDropdown index={idx} onSingleChange={onSingleChange} port={port} />
                </InputGroupItem>
                <TextInput
                  aria-describedby="ports-help"
                  className="pf-v6-c-form-control"
                  data-test="port-input"
                  id={`${key}-port`}
                  name={`${key}-port`}
                  onChange={(event) =>
                    onSingleChange(
                      {
                        ...port,
                        port: convertPort(event.currentTarget.value),
                      },
                      idx,
                    )
                  }
                  placeholder="443"
                  value={port.port}
                />
                <Button
                  aria-label={t('Remove port')}
                  className="co-create-networkpolicy__remove-port"
                  data-test="remove-port"
                  icon={<MinusCircleIcon />}
                  onClick={() => onRemove(idx)}
                  variant={ButtonVariant.plain}
                />
              </InputGroup>
            );
          })}
          <div className="co-toolbar__group co-toolbar__group--left co-create-networkpolicy__add-port">
            <Button
              className="pf-m-link--align-left pf-v6-u-mt-sm"
              data-test="add-port"
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              onClick={() => {
                onChange([...ports, { key: `port-${uuidv4}`, port: '', protocol: 'TCP' }]);
              }}
              variant={ButtonVariant.link}
            >
              {t('Add port')}
            </Button>
          </div>
        </div>
      }
    </>
  );
};

export default NetworkPolicyPorts;
