import React, { FC, FormEvent, ReactNode } from 'react';

import { useModal } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  ButtonVariant,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
  Grid,
  TextInput,
} from '@patternfly/react-core';
import ConfirmModal, { ConfirmModalProps } from '@utils/components/ConfirmModal/ConfirmModal';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  UserDefinedNetworkLayer3Subnet,
  UserDefinedNetworkSubnet,
} from '@utils/resources/udns/types';

type UDNSubnetsProps = {
  description: ReactNode;
  onSubnetsChange: (subnets: UserDefinedNetworkSubnet[]) => void;
  subnets: UserDefinedNetworkSubnet[];
  title: ReactNode;
  withHostSubnet?: boolean;
};

const UDNSubnets: FC<UDNSubnetsProps> = ({
  description,
  onSubnetsChange,
  subnets,
  title,
  withHostSubnet,
}) => {
  const { t } = useNetworkingTranslation();
  const createModal = useModal();

  const addSubnet = () => {
    if (withHostSubnet) {
      onSubnetsChange([...subnets, { cidr: '' }]);
    } else {
      onSubnetsChange([...subnets, '']);
    }
  };

  const updateSubnet = (
    event: FormEvent<HTMLInputElement>,
    idx: number,
    value: UserDefinedNetworkSubnet,
  ) => {
    event.preventDefault();
    subnets[idx] = value;
    onSubnetsChange(subnets);
  };

  const removeAll = () => {
    createModal<ConfirmModalProps>(ConfirmModal, {
      btnText: t('Remove all'),
      executeFn: () => {
        onSubnetsChange([]);
        return Promise.resolve();
      },
      message: t('This action will remove all subnets and cannot be undone.'),
      title: t('Remove subnets?'),
    });
  };

  const getRow = (subnet: UserDefinedNetworkSubnet, idx: number) => {
    if (withHostSubnet) {
      const l3Subnet = subnet as UserDefinedNetworkLayer3Subnet;
      return (
        <Grid hasGutter md={6}>
          <FormGroup isRequired label={t('CIDR')}>
            <TextInput
              key={idx}
              onChange={(event, value) => updateSubnet(event, idx, { ...l3Subnet, cidr: value })}
              value={l3Subnet.cidr}
            />
          </FormGroup>
          <FormGroup label={t('HostSubnet')}>
            <TextInput
              key={idx}
              onChange={(event, value) =>
                updateSubnet(event, idx, {
                  ...l3Subnet,
                  hostSubnet: value.length ? Number(value) : undefined,
                })
              }
              type="number"
              value={l3Subnet.hostSubnet}
            />
          </FormGroup>
        </Grid>
      );
    } else {
      return (
        <FormGroup isRequired label={t('CIDR')}>
          <TextInput
            key={idx}
            onChange={(event, value) => updateSubnet(event, idx, value)}
            value={subnet as string}
          />
        </FormGroup>
      );
    }
  };

  return (
    <FormFieldGroupExpandable
      header={
        <FormFieldGroupHeader
          actions={
            <>
              <Button
                data-test="remove-all"
                isDisabled={subnets.length === 0}
                onClick={removeAll}
                variant={ButtonVariant.link}
              >
                {t('Remove all')}
              </Button>
              <Button data-test="add-subnet" onClick={addSubnet} variant={ButtonVariant.secondary}>
                {t('Add subnet')}
              </Button>
            </>
          }
          titleDescription={description}
          titleText={{
            id: 'subnets-header',
            text: title,
          }}
        />
      }
      isExpanded
      toggleAriaLabel="Subnets"
    >
      {subnets.map((subnet, idx) => getRow(subnet, idx))}
    </FormFieldGroupExpandable>
  );
};

export default UDNSubnets;
