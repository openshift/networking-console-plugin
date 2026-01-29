import React, { FC, useState } from 'react';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui/kubevirt-api/console';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Button, ButtonVariant, Skeleton } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import { SHOW_MAX_ITEMS } from './constants';

type ExpandableProjectListProps = {
  emptyMessage?: string;
  loaded?: boolean;
  maxItems?: number;
  projectNames: string[];
};

const ExpandableProjectList: FC<ExpandableProjectListProps> = ({
  emptyMessage,
  loaded = true,
  maxItems = SHOW_MAX_ITEMS,
  projectNames,
}) => {
  const [expand, setExpand] = useState(false);
  const { t } = useNetworkingTranslation();

  if (!loaded) return <Skeleton />;

  if (isEmpty(projectNames)) return <span>{emptyMessage ?? t('No projects matched')}</span>;

  return (
    <>
      {projectNames.slice(0, expand ? projectNames.length : maxItems).map((project) => (
        <ResourceLink
          groupVersionKind={modelToGroupVersionKind(NamespaceModel)}
          key={project}
          name={project}
        />
      ))}
      {projectNames.length > maxItems && (
        <Button onClick={() => setExpand(!expand)} variant={ButtonVariant.link}>
          {expand
            ? t('Show less')
            : t('+{{count}} more', { count: projectNames.length - maxItems })}
        </Button>
      )}
    </>
  );
};

export default ExpandableProjectList;
