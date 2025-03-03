import React, { FC, useState } from 'react';

import {
  getGroupVersionKindForModel,
  K8sModel,
  k8sPatch,
  K8sResourceCommon,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ActionList,
  ActionListItem,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
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
      className="ocs-modal networking-modal"
      footer={
        <ActionList className="tabmodal-footer">
          <ActionListItem>
            <Button
              isDisabled={loading}
              isLoading={loading}
              onClick={updatePodSelector}
              variant={ButtonVariant.primary}
            >
              {t('Save')}
            </Button>
          </ActionListItem>
          <ActionListItem>
            <Button onClick={closeModal} variant={ButtonVariant.link}>
              {t('Cancel')}
            </Button>
          </ActionListItem>
        </ActionList>
      }
      id="pod-selector-modal"
      isOpen
      onClose={closeModal}
      position="top"
      title={t('Edit Pod selector')}
      variant={ModalVariant.small}
    >
      <div className="row co-m-form-row">
        <div className="col-sm-12">
          <label className="control-label" htmlFor="tags-input">
            {t('Pod selector for')}{' '}
            <ResourceIcon groupVersionKind={getGroupVersionKindForModel(model)} />
            {resource?.metadata?.name}
          </label>
          <SelectorInput
            autoFocus
            onChange={(newSelector) => setSelector(newSelector)}
            tags={selector || []}
          />
        </div>
        {error && (
          <Alert title={t('Error')} variant={AlertVariant.danger}>
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  );
};

export default PodSelectorModal;
