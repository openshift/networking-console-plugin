import React, { FC } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName } from '@utils/resources/shared';
import { RouteKind } from '@utils/types';
import { isEmpty } from '@utils/utils';

import AlternateService from './AlternateService';

type AlternateServicesSectionProps = {
  services: IoK8sApiCoreV1Service[];
};

const AlternateServicesSection: FC<AlternateServicesSectionProps> = ({ services }) => {
  const { t } = useNetworkingTranslation();

  const { control, watch } = useFormContext<RouteKind>();

  const { append, fields, remove } = useFieldArray({ control, name: 'spec.alternateBackends' });

  const selectedServiceNames = watch('spec.alternateBackends')?.map((field) => field.name) || [];
  const filteredServices = (services || []).filter(
    (service) => !selectedServiceNames.includes(getName(service)),
  );

  return (
    <>
      {fields.map((field, index) => (
        <AlternateService
          field={field}
          filteredServices={filteredServices}
          index={index}
          key={field.id}
          remove={remove}
        />
      ))}

      {!isEmpty(filteredServices) && (
        <Button
          icon={<PlusCircleIcon className="co-icon-space-r" />}
          className="pf-m-link--align-left co-create-route__add-service-btn"
          isInline
          onClick={() => append({ kind: 'Service', name: '', weight: 100 })}
          type="button"
          variant={ButtonVariant.link}
        >
          {t('Add alternate Service')}
        </Button>
      )}
    </>
  );
};

export default AlternateServicesSection;
