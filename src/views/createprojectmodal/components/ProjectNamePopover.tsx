import React, { FC } from 'react';

import { Button, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const ProjectNamePopover: FC = () => {
  const { t } = useNetworkingTranslation();

  return (
    <Popover
      aria-label={t('Naming information')}
      bodyContent={
        <>
          <p>
            {t(
              "A Project name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
            )}
          </p>
          <p>
            {t(
              "You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
            )}
          </p>
        </>
      }
    >
      <Button
        aria-label={t('View naming information')}
        className="co-button-help-icon"
        variant="plain"
      >
        <OutlinedQuestionCircleIcon />
      </Button>
    </Popover>
  );
};

export default ProjectNamePopover;
