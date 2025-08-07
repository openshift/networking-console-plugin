import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  List,
  ListItem,
  Popover,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ProjectGroupVersionKind } from '@utils/hooks/useProjects/constants';
import { getName } from '@utils/resources/shared';
import { match } from '@views/udns/list/components/utils';

import { VMNetworkForm } from '../constants';
import useUDNProjects from '../hook/useUDNProjects';

const SelectedProjects: FC = () => {
  const { t } = useNetworkingTranslation();

  const { watch } = useFormContext<VMNetworkForm>();

  const namespaceSelector = watch('network.spec.namespaceSelector');
  const projectList = watch('projectList');

  const [projects] = useUDNProjects();

  const matchingProjects = projects?.filter((project) => {
    if (projectList)
      return namespaceSelector.matchExpressions?.some((expr) =>
        expr.values.includes(getName(project)),
      );

    return namespaceSelector.matchLabels ? match(project, namespaceSelector.matchLabels) : true;
  });

  return (
    <Alert
      title={t('{{count}} projects selected', { count: matchingProjects.length })}
      variant={matchingProjects.length === 0 ? AlertVariant.warning : AlertVariant.success}
    >
      {matchingProjects.length === 0 ? (
        t('No projects matched')
      ) : (
        <Popover
          bodyContent={
            <List>
              {matchingProjects?.map((project) => (
                <ListItem key={getName(project)}>
                  <ResourceIcon groupVersionKind={ProjectGroupVersionKind} />
                  {getName(project)}
                </ListItem>
              ))}
            </List>
          }
        >
          <Button isInline variant={ButtonVariant.link}>
            {t('View selected projects')}
          </Button>
        </Popover>
      )}
    </Alert>
  );
};

export default SelectedProjects;
