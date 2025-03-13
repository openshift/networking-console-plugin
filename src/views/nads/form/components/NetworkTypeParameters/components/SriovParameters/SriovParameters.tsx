import React, { FC, Ref, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import SriovNetworkNodePolicyModel from '@kubevirt-ui/kubevirt-api/console/models/SriovNetworkNodePolicyModel';
import {
  getGroupVersionKindForModel,
  K8sResourceKind,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import PopoverHelpIcon from '@utils/components/PopoverHelpIcon/PopoverHelpIcon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  NetworkAttachmentDefinitionFormInput,
  NetworkTypeKeys,
} from '@views/nads/form/utils/types';

const SriovParameters: FC = () => {
  const { t } = useNetworkingTranslation();
  const { control, register } = useFormContext<NetworkAttachmentDefinitionFormInput>();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [sriovNetNodePoliciesData] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: getGroupVersionKindForModel(SriovNetworkNodePolicyModel),
    isList: true,
    optional: true,
  });

  return (
    <>
      <FormGroup isRequired label={t('Resource name')}>
        <Controller
          control={control}
          name={`${NetworkTypeKeys.sriovNetworkType}.resourceName`}
          render={({ field: { onChange, value } }) => (
            <Dropdown
              id="resource-name"
              isOpen={isDropdownOpen}
              onSelect={() => setIsDropdownOpen(false)}
              selected={value}
              toggle={(toggleRef: Ref<MenuToggleElement>) => (
                <MenuToggle
                  id="toggle-nads-network-type"
                  isExpanded={isDropdownOpen}
                  isFullWidth
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  ref={toggleRef}
                >
                  {value || t('Select resource name')}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {sriovNetNodePoliciesData.map((policy) => {
                  const policyName = policy?.spec?.resourceName;
                  return (
                    <DropdownItem
                      key={policyName}
                      onClick={() => {
                        onChange(policyName);
                      }}
                      value={policyName}
                    >
                      {policyName}
                    </DropdownItem>
                  );
                })}
              </DropdownList>
            </Dropdown>
          )}
          rules={{ required: true }}
        />
      </FormGroup>
      <FormGroup label={t('IP address management')}>
        <TextArea {...register(`${NetworkTypeKeys.sriovNetworkType}.ipam`)} />
      </FormGroup>
      <FormGroup
        label={t('VLAN tag number')}
        labelHelp={<PopoverHelpIcon bodyContent={t('Example: 100')} />}
      >
        <TextInput {...register(`${NetworkTypeKeys.sriovNetworkType}.vlanTagNum`)} />
      </FormGroup>
    </>
  );
};

export default SriovParameters;
