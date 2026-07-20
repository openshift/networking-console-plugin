import React, { FC, useCallback, useMemo } from 'react';
import { Trans } from 'react-i18next';

import { modelToGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { Action, ResourceLink, useModal } from '@openshift-console/dynamic-plugin-sdk';
import { ButtonVariant } from '@patternfly/react-core';
import ActionsDropdown from '@utils/components/ActionsDropdown/ActionsDropdown';
import ConfirmModal, { ConfirmModalProps } from '@utils/components/ConfirmModal/ConfirmModal';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';
import { removeVMFromNAD } from '@utils/resources/vm/utils';
import { networkConsole } from '@utils/utils/helpers';

type UDNVirtualMachineRowActionsProps = {
  interfaceName: string;
  udn: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
  vm: V1VirtualMachine;
};

const UDNVirtualMachineRowActions: FC<UDNVirtualMachineRowActionsProps> = ({
  interfaceName,
  udn,
  vm,
}) => {
  const { t } = useNetworkingTranslation();
  const createModal = useModal();
  const vmName = getName(vm);
  const vmNamespace = getNamespace(vm);
  const udnName = getName(udn);

  const onRemove = useCallback(() => {
    createModal<ConfirmModalProps>(ConfirmModal, {
      btnText: t('Remove'),
      btnVariant: ButtonVariant.danger,
      executeFn: () => {
        removeVMFromNAD(vm, interfaceName).catch((error) => {
          networkConsole.warn('Failed to remove virtual machine from network', error);
        });
      },
      message: (
        <Trans ns="plugin__networking-console-plugin" t={t}>
          Are you sure you want to remove{' '}
          <ResourceLink
            className="pf-v6-u-mr-0"
            groupVersionKind={modelToGroupVersionKind(VirtualMachineModel)}
            inline
            name={vmName}
            namespace={vmNamespace}
          />{' '}
          from <strong>{udnName}</strong>?
        </Trans>
      ),
      title: t('Remove virtual machine from network?'),
    });
  }, [createModal, interfaceName, t, udnName, vm, vmName, vmNamespace]);

  const actions = useMemo<Action[]>(
    () => [
      {
        accessReview: asAccessReview(VirtualMachineModel, vm, 'update'),
        cta: onRemove,
        id: 'remove-vm-from-udn-network',
        label: t('Remove from network'),
      },
    ],
    [onRemove, t, vm],
  );

  return <ActionsDropdown actions={actions} isKebabToggle />;
};

export default UDNVirtualMachineRowActions;
