import React, { FC } from 'react';

import {
  Button,
  ButtonVariant,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  TextInput,
  Tooltip,
  ValidatedOptions,
} from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { PORTS_FIELD_ID, SERVICE_PORT_PROTOCOLS } from './utils/constants';
import type { ServicePortFormData } from './utils/types';

type ServicePortsFieldProps = {
  error?: string;
  onChange: (ports: ServicePortFormData[]) => void;
  ports: ServicePortFormData[];
  serviceType?: string;
};

const emptyPort = (): ServicePortFormData => ({
  name: '',
  port: '',
  protocol: SERVICE_PORT_PROTOCOLS[0],
  targetPort: '',
});

const ServicePortsField: FC<ServicePortsFieldProps> = ({ error, onChange, ports, serviceType }) => {
  const { t } = useNetworkingTranslation();
  const showsNodePort = serviceType === 'NodePort' || serviceType === 'LoadBalancer';
  const validated = error ? ValidatedOptions.error : ValidatedOptions.default;

  const updatePort = (index: number, values: Partial<ServicePortFormData>) => {
    onChange(ports.map((port, portIndex) => (portIndex === index ? { ...port, ...values } : port)));
  };

  return (
    <FormGroup fieldId={PORTS_FIELD_ID} isRequired label={t('Ports')}>
      <Grid hasGutter>
        <GridItem sm={2}>{t('Name')}</GridItem>
        <GridItem sm={2}>{t('Protocol')}</GridItem>
        <GridItem sm={2}>{t('Port')}</GridItem>
        <GridItem sm={showsNodePort ? 2 : 3}>{t('Target port')}</GridItem>
        {showsNodePort && <GridItem sm={2}>{t('Node port')}</GridItem>}
        {ports.map((servicePort, index) => (
          <GridItem key={index} span={12}>
            <Grid hasGutter>
              <GridItem sm={2}>
                <TextInput
                  aria-invalid={Boolean(error)}
                  aria-label={t('Port name')}
                  id={`${PORTS_FIELD_ID}-${index}-name`}
                  onChange={(_, value) => updatePort(index, { name: value })}
                  validated={validated}
                  value={servicePort.name}
                />
              </GridItem>
              <GridItem sm={2}>
                <FormSelect
                  aria-invalid={Boolean(error)}
                  aria-label={t('Protocol')}
                  id={`${PORTS_FIELD_ID}-${index}-protocol`}
                  onChange={(_, value) => updatePort(index, { protocol: value })}
                  validated={validated}
                  value={servicePort.protocol}
                >
                  {SERVICE_PORT_PROTOCOLS.map((protocol) => (
                    <FormSelectOption key={protocol} label={protocol} value={protocol} />
                  ))}
                </FormSelect>
              </GridItem>
              <GridItem sm={2}>
                <TextInput
                  aria-invalid={Boolean(error)}
                  aria-label={t('Port')}
                  id={`${PORTS_FIELD_ID}-${index}-port`}
                  inputMode="numeric"
                  onChange={(_, value) => updatePort(index, { port: value })}
                  pattern="[0-9]*"
                  type="text"
                  validated={validated}
                  value={servicePort.port}
                />
              </GridItem>
              <GridItem sm={showsNodePort ? 2 : 3}>
                <TextInput
                  aria-invalid={Boolean(error)}
                  aria-label={t('Target port')}
                  id={`${PORTS_FIELD_ID}-${index}-target-port`}
                  onChange={(_, value) => updatePort(index, { targetPort: value })}
                  validated={validated}
                  value={servicePort.targetPort}
                />
              </GridItem>
              {showsNodePort && (
                <GridItem sm={2}>
                  <TextInput
                    aria-invalid={Boolean(error)}
                    aria-label={t('Node port')}
                    id={`${PORTS_FIELD_ID}-${index}-node-port`}
                    inputMode="numeric"
                    onChange={(_, value) => updatePort(index, { nodePort: value })}
                    pattern="[0-9]*"
                    type="text"
                    validated={validated}
                    value={servicePort.nodePort || ''}
                  />
                </GridItem>
              )}
              <GridItem sm={1}>
                <Tooltip content={t('Remove')}>
                  <Button
                    aria-label={t('Remove port')}
                    icon={<MinusCircleIcon />}
                    onClick={() => onChange(ports.filter((_, portIndex) => portIndex !== index))}
                    variant={ButtonVariant.plain}
                  />
                </Tooltip>
              </GridItem>
            </Grid>
          </GridItem>
        ))}
        {error && (
          <GridItem span={12}>
            <FormGroupHelperText validated={ValidatedOptions.error}>{error}</FormGroupHelperText>
          </GridItem>
        )}
        <GridItem>
          <Button
            icon={<PlusCircleIcon />}
            onClick={() => onChange([...ports, emptyPort()])}
            variant={ButtonVariant.link}
          >
            {t('Add port')}
          </Button>
        </GridItem>
      </Grid>
    </FormGroup>
  );
};

export default ServicePortsField;
