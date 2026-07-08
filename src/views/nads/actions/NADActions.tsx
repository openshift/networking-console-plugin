import React, { FC } from 'react';

import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';

import useNADsActions from './hooks/useNADsActions';

type NADsActionsProps = {
  isKebabToggle?: boolean;
  obj: NetworkAttachmentDefinitionKind;
};

const NADsActions: FC<NADsActionsProps> = ({ isKebabToggle, obj }) => {
  const [actions] = useNADsActions(obj);

  return (
    <ActionsDropdown actions={actions} id="network-attachment-definition-actions" isKebabToggle={isKebabToggle} />
  );
};

export default NADsActions;
