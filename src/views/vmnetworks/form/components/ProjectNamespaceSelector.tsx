import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Card, CardBody, FormGroup, Stack } from '@patternfly/react-core';
import LabelSelectorEditor from '@utils/components/LabelSelectorEditor/LabelSelectorEditor';
import { isEmpty } from '@utils/utils';

import { VMNetworkForm } from '../constants';

import SelectedProjects from './SelectedProjects';

const ProjectNamespaceSelector: FC = () => {
  const { control, watch } = useFormContext<VMNetworkForm>();
  const matchLabels = watch('network.spec.namespaceSelector.matchLabels') || {};

  const hasValidMatchLabels =
    !isEmpty(matchLabels) && !(Object.keys(matchLabels).length === 1 && matchLabels[''] === '');

  return (
    <Stack className="pf-v6-u-pl-md" hasGutter>
      <Controller
        control={control}
        name="network.spec.namespaceSelector.matchLabels"
        render={({ field: { onChange, value: matchLabel } }) => {
          const labelSelectorPairs = Object.entries(matchLabel);
          return (
            <FormGroup>
              <Card>
                <CardBody>
                  <LabelSelectorEditor
                    labelSelectorPairs={
                      isEmpty(labelSelectorPairs) ? [['', '']] : labelSelectorPairs
                    }
                    onLastItemRemoved={() => onChange({})}
                    updateParentData={(newLabels) => onChange(Object.fromEntries(newLabels))}
                  />
                </CardBody>
              </Card>
            </FormGroup>
          );
        }}
      />
      {hasValidMatchLabels && <SelectedProjects />}
    </Stack>
  );
};

export default ProjectNamespaceSelector;
