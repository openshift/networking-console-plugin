import React, { FC, useMemo } from 'react';

import { NetworkAttachmentDefinitionModelGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, FormGroup } from '@patternfly/react-core';
import Loading from '@utils/components/Loading/Loading';
import SelectMultiTypeahead from '@utils/components/SelectMultiTypeahead/SelectMultiTypeahead';
import { DEFAULT_NAMESPACE } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NetworkPolicy } from '@utils/models';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';
import { getName, getNamespace } from '@utils/resources/shared';

type NADsSelectorProps = {
  namespace: string;
  networkPolicy: NetworkPolicy;
  onPolicyChange: (policy: NetworkPolicy) => void;
};

const NADsSelector: FC<NADsSelectorProps> = ({ namespace, networkPolicy, onPolicyChange }) => {
  const { t } = useNetworkingTranslation();

  const [nads, loaded, loadError] = useK8sWatchResource<NetworkAttachmentDefinitionKind[]>({
    groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
    isList: true,
    namespace,
  });

  const [nadsDefault, loadedDefaultNads, loadErrorDefaultNads] = useK8sWatchResource<
    NetworkAttachmentDefinitionKind[]
  >(
    namespace !== DEFAULT_NAMESPACE
      ? {
          groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
          isList: true,
          namespace: DEFAULT_NAMESPACE,
        }
      : null,
  );

  const nadsOptions = useMemo(() => {
    const allNads = [...(nads || []), ...(nadsDefault || [])];

    return allNads.map((nad) => ({
      value: `${getNamespace(nad)}/${getName(nad)}`,
    }));
  }, [nads, nadsDefault]);

  const onChange = (newNADs: string[]) => {
    onPolicyChange({ ...networkPolicy, policyFor: newNADs });
  };

  if (!loaded || !loadedDefaultNads) return <Loading />;

  if (loadError || loadErrorDefaultNads)
    return (
      <Alert title={t('Error')} variant={AlertVariant.danger}>
        {loadError}
      </Alert>
    );
  return (
    <FormGroup fieldId="multi-networkpolicy-policyfor" isRequired label={t('Policy for')}>
      <SelectMultiTypeahead
        options={nadsOptions}
        placeholder={t('Select one or more NetworkAttachmentDefinitions')}
        selected={networkPolicy.policyFor || []}
        setSelected={onChange}
      />
    </FormGroup>
  );
};

export default NADsSelector;
