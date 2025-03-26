import React, { FC, useState } from 'react';

import {
  getGroupVersionKindForModel,
  K8sModel,
  k8sPatch,
  K8sResourceCommon,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';
import { get } from '@utils/utils/helpers';

import SelectorInput from './SelectorInput';
import { arrayify, objectify } from './selectorUtils';

import '@styles/modal-action.scss';

export type PodSelectorModalProps = {
  closeModal?: () => void;
  model: K8sModel;
  path?: string;
  resource: K8sResourceCommon;
};

const PodSelectorModal: FC<PodSelectorModalProps> = ({
  closeModal,
  model,
  path = 'spec.selector',
  resource,
}) => {
  const { t } = useNetworkingTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const initialSelector = get(resource, path);

  const [selector, setSelector] = useState(arrayify(initialSelector));

  const createPath = isEmpty(initialSelector);

  const updatePodSelector = async () => {
    setLoading(true);
    try {
      k8sPatch({
        data: [
          {
            op: createPath ? 'add' : 'replace',
            path: '/spec/selector',
            value: objectify(selector),
          },
        ],
        model: model,
        resource: resource,
      });

      closeModal();
    } catch (apiError) {
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="networking-modal"
      id="pod-selector-modal"
      isOpen
      onClose={closeModal}
      position="top"
      variant={ModalVariant.small}
    >
      <ModalHeader title={t('Edit Pod selector')} />
      <ModalBody>
        <div className="pf-v6-c-form">
          <FormGroup
            fieldId="tags-input"
            label={
              <>
                {t('Pod selector for')}{' '}
                <ResourceIcon groupVersionKind={getGroupVersionKindForModel(model)} />
                {resource?.metadata?.name}
              </>
            }
          >
            <SelectorInput
              autoFocus
              onChange={(newSelector) => setSelector(newSelector)}
              tags={selector || []}
            />
          </FormGroup>
        </div>
        {error && (
          <Alert
            className="pf-v6-u-mt-md"
            isInline
            title={t('Error')}
            variant={AlertVariant.danger}
          >
            {error}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter className="tabmodal-footer">
        <Button
          isDisabled={loading}
          isLoading={loading}
          onClick={updatePodSelector}
          variant={ButtonVariant.primary}
        >
          {t('Save')}
        </Button>
        <Button onClick={closeModal} variant={ButtonVariant.link}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PodSelectorModal;
