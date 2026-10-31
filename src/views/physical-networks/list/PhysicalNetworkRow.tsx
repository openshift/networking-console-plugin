import React, { Dispatch, FC, SetStateAction } from 'react';
import { useNavigate } from 'react-router';

import { ActionsColumn, ExpandableRowContent, Tbody, Td, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { NO_DATA_DASH } from '@utils/utils/constants';

import {
  NODE_NETWORK_CONFIGURATION_WIZARD_PATH,
  PHYSICAL_NETWORK_NAME_PARAM_KEY,
  VM_NETWORK_NEW_PATH,
} from '../utils/constants';
import {
  ConfigurationDetails,
  ConsumersAvailability,
  LocalnetNAD,
  PhysicalNetwork,
  PhysicalNetworksSources,
} from '../utils/types';

import ConfigurationsTable from './ConfigurationsTable';
import NetworkDefinitionsTable from './NetworkDefinitionsTable';
import ObservedMappingsTable from './ObservedMappingsTable';
import { getSourceBackedValue } from './utils';

type PhysicalNetworkRowProps = {
  actionsEnabled: { configure: boolean; createVMNetwork: boolean };
  consumersAvailability: ConsumersAvailability;
  index: number;
  isExpanded: boolean;
  network: PhysicalNetwork;
  onShowConsumers: (nad: LocalnetNAD, networkName: string) => void;
  onToggleExpansion: (network: PhysicalNetwork) => void;
  setSelectedConfiguration: Dispatch<SetStateAction<ConfigurationDetails>>;
  sources: PhysicalNetworksSources;
};

const PhysicalNetworkRow: FC<PhysicalNetworkRowProps> = ({
  actionsEnabled,
  consumersAvailability,
  index,
  isExpanded,
  network,
  onShowConsumers,
  onToggleExpansion,
  setSelectedConfiguration,
  sources,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();

  const hasDetails =
    network.nads.length + network.nncpDetails.length + network.observedMappings.length > 0;

  const rowActions = [
    ...(actionsEnabled.configure
      ? [
          {
            onClick: () =>
              navigate(
                `${NODE_NETWORK_CONFIGURATION_WIZARD_PATH}&${PHYSICAL_NETWORK_NAME_PARAM_KEY}=${encodeURIComponent(
                  network.name,
                )}`,
              ),
            title: (
              <div>
                <div className="pf-v6-c-menu__item-main">{t('Configure Nodes')}</div>
                <div className="pf-v6-c-menu__item-description">
                  {t('Expand this network to a new set of Nodes.')}
                </div>
              </div>
            ),
          },
        ]
      : []),
    ...(actionsEnabled.createVMNetwork
      ? [
          {
            onClick: () =>
              navigate(
                `${VM_NETWORK_NEW_PATH}?${PHYSICAL_NETWORK_NAME_PARAM_KEY}=${encodeURIComponent(
                  network.name,
                )}`,
              ),
            title: (
              <div>
                <div className="pf-v6-c-menu__item-main">
                  {t('Create a virtual machines network using this physical network')}
                </div>
                <div className="pf-v6-c-menu__item-description">
                  {t('Creates an OVN Localnet network. Additional configuration required.')}
                </div>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <Tbody isExpanded={isExpanded}>
      <Tr>
        <Td
          expand={
            hasDetails
              ? {
                  isExpanded,
                  onToggle: () => onToggleExpansion(network),
                  rowIndex: index,
                }
              : undefined
          }
        />
        <Td dataLabel={t('Network name')}>{network.name ?? NO_DATA_DASH}</Td>
        <Td dataLabel={t('Referenced by')}>
          {getSourceBackedValue(
            sources.nads.availability,
            network.nads.length,
            t,
            NO_DATA_DASH,
          )}
        </Td>
        <Td dataLabel={t('Desired configuration')}>
          {getSourceBackedValue(
            sources.nncps.availability,
            network.nncpDetails.length,
            t,
            t('Not configured'),
          )}
        </Td>
        <Td dataLabel={t('Observed mapping')}>
          {getSourceBackedValue(
            sources.nodeNetworkStates.availability,
            network.observedMappings.length,
            t,
            NO_DATA_DASH,
          )}
        </Td>
        <Td dataLabel={t('Actions')} isActionCell>
          {rowActions.length > 0 ? (
            <ActionsColumn items={rowActions} />
          ) : (
            NO_DATA_DASH
          )}
        </Td>
      </Tr>
      {hasDetails && (
        <Tr isExpanded={isExpanded}>
          <Td colSpan={6}>
            <ExpandableRowContent>
              {network.nads.length > 0 && (
                <div className="pf-v6-u-mb-md">
                  <NetworkDefinitionsTable
                    consumersAvailability={consumersAvailability}
                    consumersByNAD={network.consumersByNAD}
                    nads={network.nads}
                    networkName={network.name}
                    onShowConsumers={onShowConsumers}
                  />
                </div>
              )}
              {network.nncpDetails.length > 0 && (
                <div className="pf-v6-u-mb-md">
                  <ConfigurationsTable
                    nncpDetails={network.nncpDetails}
                    setSelectedConfiguration={setSelectedConfiguration}
                  />
                </div>
              )}
              {network.observedMappings.length > 0 && (
                <ObservedMappingsTable observedMappings={network.observedMappings} />
              )}
            </ExpandableRowContent>
          </Td>
        </Tr>
      )}
    </Tbody>
  );
};

export default PhysicalNetworkRow;
