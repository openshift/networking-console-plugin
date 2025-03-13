import React, { FC, FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';

import { NetworkPolicyModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiNetworkingV1NetworkPolicy } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { k8sCreate, useModal } from '@openshift-console/dynamic-plugin-sdk';
import { Form, PageSection, Title } from '@patternfly/react-core';
import ConfirmModal, { ConfirmModalProps } from '@utils/components/ConfirmModal/ConfirmModal';
import { useClusterNetworkFeatures } from '@utils/hooks/useClusterNetworkFeatures';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import {
  checkNetworkPolicyValidity,
  isNetworkPolicyConversionError,
  MultiNetworkPolicyModel,
  NetworkPolicy,
  networkPolicyFromK8sResource,
  networkPolicyNormalizeK8sResource,
  networkPolicyToK8sResource,
} from '@utils/models/index';
import { resourcePathFromModel } from '@utils/resources/shared';

import NetworkPolicyFormActionButtons from './components/NetworkPolicyFormActionButtons';
import NetworkPolicyFormAlert from './components/NetworkPolicyFormAlert';
import NetworkPolicyFormDenyCheckBoxses from './components/NetworkPolicyFormDenyCheckBoxses';
import NetworkPolicyFormEgress from './components/NetworkPolicyFormEgress';
import NetworkPolicyFormIngress from './components/NetworkPolicyFormIngress';
import NetworkPolicyFormName from './components/NetworkPolicyFormName';
import NetworkPolicyFormPodSelector from './components/NetworkPolicyFormPodSelector';
import NetworkPolicyFormSDNAlert from './components/NetworkPolicyFormSDNAlert';
import useIsMultiNetworkPolicy from './hooks/useIsMultiNetworkPolicy';
import NADsSelector from './NADsSelector';

type NetworkPolicyFormSectionsProps = {
  formData: IoK8sApiNetworkingV1NetworkPolicy;
  onChange: (newFormData: IoK8sApiNetworkingV1NetworkPolicy) => void;
};

const NetworkPolicyFormSections: FC<NetworkPolicyFormSectionsProps> = ({ formData, onChange }) => {
  const navigate = useNavigate();
  const { t } = useNetworkingTranslation();

  const isMultiCreateForm = useIsMultiNetworkPolicy();
  const { ns: namespace } = useParams();

  const createModal = useModal();

  const normalizedK8S = networkPolicyNormalizeK8sResource(formData);
  const converted = networkPolicyFromK8sResource(normalizedK8S);
  const [networkPolicy, setNetworkPolicy] = useState(converted);

  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState('');
  const [networkFeatures, networkFeaturesLoaded] = useClusterNetworkFeatures();

  if (isNetworkPolicyConversionError(networkPolicy)) {
    return (
      <NetworkPolicyFormAlert
        message={networkPolicy.error}
        title={t(
          'This NetworkPolicy cannot be displayed in form. Please switch to the YAML editor.',
        )}
      />
    );
  }

  const onPolicyChange = (policy: NetworkPolicy) => {
    setNetworkPolicy(policy);
    onChange(networkPolicyToK8sResource(policy, isMultiCreateForm));
  };

  const removeAll = (msg: string, execute: () => void) => {
    createModal<ConfirmModalProps>(ConfirmModal, {
      btnText: t('Remove all'),
      executeFn: () => {
        execute();
        return Promise.resolve();
      },
      message: msg,
      title: t('Are you sure?'),
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const invalid = checkNetworkPolicyValidity(networkPolicy);
    if (invalid) {
      setError(invalid.error);
      return;
    }
    const policy = networkPolicyToK8sResource(networkPolicy, isMultiCreateForm);

    const model = isMultiCreateForm ? MultiNetworkPolicyModel : NetworkPolicyModel;
    try {
      setInProgress(true);
      await k8sCreate({ data: policy, model });
      setInProgress(false);
      navigate(resourcePathFromModel(model, networkPolicy.name, networkPolicy.namespace));
    } catch (err) {
      setError(err.message);
      setInProgress(false);
    }
  };

  return (
    <PageSection>
      <Form className="co-create-networkpolicy" onSubmit={onSubmit}>
        <NetworkPolicyFormSDNAlert
          networkFeatures={networkFeatures}
          networkFeaturesLoaded={networkFeaturesLoaded}
        />
        <NetworkPolicyFormName networkPolicy={networkPolicy} onPolicyChange={onPolicyChange} />
        {isMultiCreateForm && (
          <NADsSelector
            namespace={namespace}
            networkPolicy={networkPolicy}
            onPolicyChange={onPolicyChange}
          />
        )}
        <NetworkPolicyFormPodSelector
          networkPolicy={networkPolicy}
          onPolicyChange={onPolicyChange}
        />
        <Title headingLevel="h2">{t('Policy type')}</Title>
        <NetworkPolicyFormDenyCheckBoxses
          networkFeatures={networkFeatures}
          networkFeaturesLoaded={networkFeaturesLoaded}
          networkPolicy={networkPolicy}
          onPolicyChange={onPolicyChange}
        />
        <NetworkPolicyFormIngress
          networkPolicy={networkPolicy}
          onPolicyChange={onPolicyChange}
          removeAll={removeAll}
        />
        <NetworkPolicyFormEgress
          networkFeatures={networkFeatures}
          networkFeaturesLoaded={networkFeaturesLoaded}
          networkPolicy={networkPolicy}
          onPolicyChange={onPolicyChange}
          removeAll={removeAll}
        />
        {error && <NetworkPolicyFormAlert message={error} title={t('Error')} />}
        <NetworkPolicyFormActionButtons isDisabled={inProgress} isLoading={inProgress} />
      </Form>
    </PageSection>
  );
};

export default NetworkPolicyFormSections;
