import React, { FC, useCallback, useState } from 'react';

import { Modal, ModalBody, ModalHeader, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { ConfigurationDetails } from '../utils/types';

import DetailsTab from './DetailsTab';
import EnactmentStateTab from './EnactmentStateTab';

enum ConfigurationDrawerTabKey {
  Details = 'Details',
  EnactmentState = 'EnactmentState',
}

type ConfigurationDrawerProps = {
  isOpen: boolean;
  nmstateFrontendAvailable: boolean;
  onClose: () => void;
  selectedConfiguration: ConfigurationDetails;
};

const ConfigurationDrawer: FC<ConfigurationDrawerProps> = ({
  isOpen,
  nmstateFrontendAvailable,
  onClose,
  selectedConfiguration,
}) => {
  const { t } = useNetworkingTranslation();
  const [activeTabKey, setActiveTabKey] = useState<ConfigurationDrawerTabKey>(
    ConfigurationDrawerTabKey.Details,
  );

  const handleTabKey = useCallback((_: unknown, tabKey: ConfigurationDrawerTabKey): void => {
    setActiveTabKey(tabKey);
  }, []);

  return (
    <Modal
      aria-label={t('Configuration drawer')}
      className="ocs-modal co-catalog-page__overlay co-catalog-page__overlay--right"
      disableFocusTrap
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalHeader title={selectedConfiguration?.configurationName} />
      <ModalBody>
        <Tabs activeKey={activeTabKey} onSelect={handleTabKey}>
          <Tab
            eventKey={ConfigurationDrawerTabKey.Details}
            title={<TabTitleText>{t('Details')}</TabTitleText>}
          >
            <DetailsTab
              nmstateFrontendAvailable={nmstateFrontendAvailable}
              selectedConfiguration={selectedConfiguration}
            />
          </Tab>
          <Tab
            eventKey={ConfigurationDrawerTabKey.EnactmentState}
            title={<TabTitleText>{t('Enactment state')}</TabTitleText>}
          >
            <EnactmentStateTab selectedConfiguration={selectedConfiguration} />
          </Tab>
        </Tabs>
      </ModalBody>
    </Modal>
  );
};

export default ConfigurationDrawer;
