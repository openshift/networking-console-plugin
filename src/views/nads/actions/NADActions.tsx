import React, { FC } from 'react';

import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';

import useNADsActions from './hooks/useNADsActions';

type NADsActionsProps = {
  includeOpenDetails?: boolean;
  isKebabToggle?: boolean;
  obj: NetworkAttachmentDefinitionKind;
};

const NADsActions: FC<NADsActionsProps> = ({ includeOpenDetails, isKebabToggle, obj }) => {
  const [actions] = useNADsActions(obj, includeOpenDetails);

  return (
    <ActionsDropdown
      actions={actions}
      id="network-attachment-definition-actions"
      isKebabToggle={isKebabToggle}
    />
  );
};

export default NADsActions;
