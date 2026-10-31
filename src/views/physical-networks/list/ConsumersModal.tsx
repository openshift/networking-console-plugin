import React, { FC, useState } from 'react';
import { Link } from 'react-router';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { Modal, ModalBody, ModalHeader, SearchInput } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NO_DATA_DASH } from '@utils/utils/constants';

import { ConsumersAvailability, LocalnetNAD, PhysicalNetworkConsumer } from '../utils/types';

import './consumers-modal.scss';

type ConsumersModalProps = {
  availability: ConsumersAvailability;
  consumers: PhysicalNetworkConsumer[];
  isOpen: boolean;
  nad: LocalnetNAD;
  onClose: () => void;
};

const ConsumersModal: FC<ConsumersModalProps> = ({
  availability,
  consumers,
  isOpen,
  nad,
  onClose,
}) => {
  const { t } = useNetworkingTranslation();
  const [searchInput, setSearchInput] = useState('');

  const filteredConsumers = consumers.filter(({ name }) => name?.includes(searchInput));
  const kinds: PhysicalNetworkConsumer['kind'][] = ['Pod', 'VirtualMachine'];

  return (
    <Modal
      aria-label={t('Consumers modal')}
      className="consumers-modal"
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
    >
      <ModalHeader title={t('Consumers of {{name}}', { name: nad?.name ?? NO_DATA_DASH })} />
      <ModalBody>
        <SearchInput
          aria-label={t('Filter consumers search input')}
          className="pf-v6-u-mb-md"
          onChange={(_event, value) => setSearchInput(value)}
          type="search"
          value={searchInput}
        />
        {availability !== 'complete' && (
          <div className="pf-v6-u-mb-md">{t('Some consumer information is unavailable.')}</div>
        )}
        <div className="consumers-modal__list">
          {kinds.map((kind) => {
            const kindConsumers = filteredConsumers.filter((consumer) => consumer.kind === kind);
            if (kindConsumers.length === 0) return null;

            return (
              <div key={kind}>
                <div className="pf-v6-u-mb-sm">{kind}</div>
                {kindConsumers.map((consumer) => (
                  <div
                    className="pf-v6-u-mb-sm"
                    key={`${consumer.kind}/${consumer.namespace}/${consumer.name}`}
                  >
                    <ResourceIcon
                      className="pf-v6-u-mr-sm"
                      groupVersionKind={consumer.groupVersionKind}
                    />
                    <Link to={consumer.url}>{consumer.name}</Link>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ConsumersModal;
