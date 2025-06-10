import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Content, ContentVariants, DropdownItem, FormGroup, Title } from '@patternfly/react-core';
import FileUpload from '@utils/components/FileUpload/FileUpload';
import Select from '@utils/components/Select/Select';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import {
  CA_CERTIFICATE_FIELD_ID,
  CERTIFICATE_FIELD_ID,
  DESTINATION_CA_CERT_FIELD_ID,
  insecureTrafficTypes,
  KEY_FIELD_ID,
  PASSTHROUGH,
  passthroughInsecureTrafficTypes,
  RE_ENCRYPT,
  terminationTypes,
  TLS_TERMINATION_FIELD_ID,
  TLS_TERMINATION_POLICY_FIELD_ID,
} from './constants';
import { omitCertificatesOnTypeChange } from './utils';

const TLSTermination: FC = () => {
  const { t } = useNetworkingTranslation();

  const { control, watch } = useFormContext();

  const terminationType = watch('spec.tls.termination');
  const isPassthrough = terminationType === PASSTHROUGH;

  return (
    <>
      <Controller
        control={control}
        name="spec.tls"
        render={({ field: { onChange, value } }) => (
          <FormGroup fieldId={TLS_TERMINATION_FIELD_ID} isRequired label={t('TLS termination')}>
            <Select
              id={TLS_TERMINATION_FIELD_ID}
              selected={value?.termination}
              toggleContent={terminationTypes[value?.termination] || t('Select termination type')}
            >
              <>
                {Object.entries(terminationTypes).map(([type, label]) => (
                  <DropdownItem
                    key={type}
                    onClick={() =>
                      onChange({
                        ...omitCertificatesOnTypeChange(value, type),
                        insecureEdgeTerminationPolicy: '',
                        termination: type,
                      })
                    }
                    value={type}
                  >
                    {label}
                  </DropdownItem>
                ))}
              </>
            </Select>
          </FormGroup>
        )}
        rules={{ required: true }}
      />
      <Controller
        control={control}
        name="spec.tls"
        render={({ field: { onChange, value } }) => (
          <FormGroup fieldId={TLS_TERMINATION_POLICY_FIELD_ID} label={t('Insecure traffic')}>
            <Select
              id={TLS_TERMINATION_POLICY_FIELD_ID}
              selected={value?.insecureEdgeTerminationPolicy}
              toggleContent={
                insecureTrafficTypes[value?.insecureEdgeTerminationPolicy] ||
                t('Select insecure traffic type')
              }
            >
              <>
                {Object.entries(
                  isPassthrough ? passthroughInsecureTrafficTypes : insecureTrafficTypes,
                ).map(([type, label]) => (
                  <DropdownItem
                    key={type}
                    onClick={() => onChange({ ...value, insecureEdgeTerminationPolicy: type })}
                    value={type}
                  >
                    {label}
                  </DropdownItem>
                ))}
              </>
            </Select>
          </FormGroup>
        )}
        rules={{ required: false }}
      />

      {terminationType && !isPassthrough && (
        <Controller
          control={control}
          name="spec.tls"
          render={({ field: { onChange, value } }) => (
            <>
              <Title headingLevel="h3">{t('Certificates')}</Title>

              <Content component={ContentVariants.p}>
                {t(
                  "TLS certificates for edge and re-encrypt termination. If not specified, the router's default certificate is used.",
                )}
              </Content>

              <FormGroup fieldId={CERTIFICATE_FIELD_ID} label={t('Certificate')}>
                <FileUpload
                  id={CERTIFICATE_FIELD_ID}
                  onClearClick={() => onChange({ ...value, certificate: '' })}
                  onDataChange={(event, data) => onChange({ ...value, certificate: data })}
                  onFileInputChange={(event, data) => onChange({ ...value, certificate: data })}
                  onTextChange={(event, data) => onChange({ ...value, certificate: data })}
                  type="text"
                  value={value?.certificate}
                />
              </FormGroup>

              <FormGroup fieldId={KEY_FIELD_ID} label={t('Private key')}>
                <FileUpload
                  id={KEY_FIELD_ID}
                  onClearClick={() => onChange({ ...value, key: '' })}
                  onDataChange={(event, data) => onChange({ ...value, key: data })}
                  onFileInputChange={(event, data) => onChange({ ...value, key: data })}
                  onTextChange={(event, data) => onChange({ ...value, key: data })}
                  type="text"
                  value={value?.key}
                />
              </FormGroup>
              <FormGroup fieldId={CA_CERTIFICATE_FIELD_ID} label={t('CA certificate')}>
                <FileUpload
                  id={CA_CERTIFICATE_FIELD_ID}
                  onClearClick={() => onChange({ ...value, caCertificate: '' })}
                  onDataChange={(event, data) => onChange({ ...value, caCertificate: data })}
                  onFileInputChange={(event, data) => onChange({ ...value, caCertificate: data })}
                  onTextChange={(event, data) => onChange({ ...value, caCertificate: data })}
                  type="text"
                  value={value?.caCertificate}
                />
              </FormGroup>

              {terminationType === RE_ENCRYPT && (
                <FormGroup
                  fieldId={DESTINATION_CA_CERT_FIELD_ID}
                  label={t('Destination CA certificate')}
                >
                  <FileUpload
                    id={DESTINATION_CA_CERT_FIELD_ID}
                    onClearClick={() => onChange({ ...value, destinationCACertificate: '' })}
                    onDataChange={(event, data) =>
                      onChange({ ...value, destinationCACertificate: data })
                    }
                    onFileInputChange={(event, data) =>
                      onChange({ ...value, destinationCACertificate: data })
                    }
                    onTextChange={(event, data) =>
                      onChange({ ...value, destinationCACertificate: data })
                    }
                    type="text"
                    value={value?.destinationCACertificate}
                  />
                </FormGroup>
              )}
            </>
          )}
          rules={{ required: false }}
        />
      )}
    </>
  );
};

export default TLSTermination;
