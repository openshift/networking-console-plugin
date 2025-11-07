import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Checkbox,
  FormGroup,
  FormSection,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import LabelSelectorEditor from '@utils/components/LabelSelectorEditor/LabelSelectorEditor';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { VMNetworkForm } from '../constants';

import SelectedProjects from './SelectedProjects';

const ProjectNamespaceSelector: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control } = useFormContext<VMNetworkForm>();

  return (
    <FormSection title={t('Projects')} titleElement="h2">
      <Controller
        control={control}
        name="network.spec.namespaceSelector.matchLabels"
        render={({ field: { onChange, value: matchLabel } }) => {
          const hasLabels = !isEmpty(matchLabel);
          return (
            <>
              <FormGroup>
                <Card>
                  <CardBody>
                    {hasLabels ? (
                      <LabelSelectorEditor
                        labelSelectorPairs={Object.entries(matchLabel || {})}
                        onLastItemRemoved={() => onChange({})}
                        updateParentData={(newLabels) => onChange(Object.fromEntries(newLabels))}
                      />
                    ) : (
                      <Button
                        icon={<PlusCircleIcon />}
                        onClick={() => onChange({ ['']: '' })}
                        variant={ButtonVariant.link}
                      >
                        {t('Add a label to specify qualifying projects')}
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </FormGroup>

              <FormGroup>
                <Controller
                  control={control}
                  name="matchLabelCheck"
                  render={({ field: { onChange: onCheckChange, value: matchLabelCheck } }) => (
                    <Checkbox
                      id="check-empty-matchlabel"
                      isChecked={hasLabels ? false : matchLabelCheck}
                      isDisabled={hasLabels}
                      label={t('Allow all current and future projects to access this network.')}
                      onChange={(_, checked) => onCheckChange(checked)}
                    />
                  )}
                />
              </FormGroup>
            </>
          );
        }}
      />

      <SelectedProjects />
    </FormSection>
  );
};

export default ProjectNamespaceSelector;
