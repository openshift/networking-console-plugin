import React, { FC } from 'react';

import { ResourceIcon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { DropdownItem, FormGroup } from '@patternfly/react-core';
import InlineLoading from '@utils/components/Loading/InlineLoading';
import Select from '@utils/components/Select/Select';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { ClusterUserDefinedNetworkModelGroupVersionKind } from '@utils/models';
import { getName } from '@utils/resources/shared';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';

const SelectClusterUDN: FC<{
  onChange: (newClusterUDN: ClusterUserDefinedNetworkKind) => void;
  selectedClusterUDN: ClusterUserDefinedNetworkKind;
}> = ({ onChange, selectedClusterUDN }) => {
  const { t } = useNetworkingTranslation();

  const [cudns, loaded] = useK8sWatchResource<ClusterUserDefinedNetworkKind[]>({
    groupVersionKind: ClusterUserDefinedNetworkModelGroupVersionKind,
    isList: true,
  });

  const selectedClusterUDNName = getName(selectedClusterUDN);

  if (!loaded) return <InlineLoading />;

  return (
    <FormGroup fieldId="select-cluster-udn" isRequired label={t('ClusterUserDefinedNetwork name')}>
      <Select
        id="select-cluster-udn"
        selected={selectedClusterUDNName}
        toggleContent={
          selectedClusterUDNName ? (
            <>
              <ResourceIcon groupVersionKind={ClusterUserDefinedNetworkModelGroupVersionKind} />{' '}
              {selectedClusterUDNName}
            </>
          ) : (
            t('Select ClusterUserDefinedNetwork')
          )
        }
      >
        <>
          {cudns?.map((cudn) => {
            const cudnName = getName(cudn);
            return (
              <DropdownItem
                key={cudnName}
                onClick={() => {
                  onChange(cudn);
                }}
                value={cudnName}
              >
                <ResourceIcon groupVersionKind={ClusterUserDefinedNetworkModelGroupVersionKind} />

                {cudnName}
              </DropdownItem>
            );
          })}
        </>
      </Select>
    </FormGroup>
  );
};

export default SelectClusterUDN;
