import React, { FC, useState } from 'react';

import { useAccessReview, useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection } from '@patternfly/react-core';
import ListErrorState from '@utils/components/ListEmptyState/ListErrorState';
import Loading from '@utils/components/Loading/Loading';
import { ALL_NAMESPACES } from '@utils/constants';
import { FLAG_KUBEVIRT, FLAG_NMSTATE, FLAG_NMSTATE_CRDS } from '@utils/flags/consts';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import NMStateGuidance from './components/NMStateGuidance';
import PhysicalNetworksEmptyState from './components/PhysicalNetworksEmptyState';
import PhysicalNetworksPageHeader from './components/PhysicalNetworksPageHeader';
import SourceStateAlerts from './components/SourceStateAlerts';
import ConfigurationDrawer from './details/ConfigurationDrawer';
import usePhysicalNetworks from './hooks/usePhysicalNetworks';
import ConsumersModal from './list/ConsumersModal';
import PhysicalNetworksTable from './list/PhysicalNetworksTable';
import ScopeSelect from './list/ScopeSelect';
import { ConfigurationDetails, LocalnetNAD, SourceAvailability } from './utils/types';

type ConsumersSelection = { nad: LocalnetNAD; networkName: string };

const PhysicalNetworksPage: FC = () => {
  const { t } = useNetworkingTranslation();
  const [scope, setScope] = useState<string>(ALL_NAMESPACES);
  const [selectedConfiguration, setSelectedConfiguration] = useState<ConfigurationDetails>();
  const [consumersSelection, setConsumersSelection] = useState<ConsumersSelection>();

  const { consumersAvailability, networks, sources } = usePhysicalNetworks(
    scope === ALL_NAMESPACES ? undefined : scope,
  );

  const kubevirtEnabled = useFlag(FLAG_KUBEVIRT);
  const nmstateFrontendAvailable = useFlag(FLAG_NMSTATE);
  const nmstateCrdsPresent = useFlag(FLAG_NMSTATE_CRDS);

  const [canConfigure] = useAccessReview({
    group: 'nmstate.io',
    resource: 'nodenetworkconfigurationpolicies',
    verb: 'create',
  });
  const [canInstallOperators] = useAccessReview({
    group: 'operators.coreos.com',
    namespace: 'openshift-operators',
    resource: 'subscriptions',
    verb: 'create',
  });

  const showGuidance =
    sources.nncps.availability !== SourceAvailability.Forbidden &&
    (sources.nncps.availability === SourceAvailability.Absent || !nmstateCrdsPresent);

  const actionsEnabled = {
    configure: !!nmstateFrontendAvailable && canConfigure,
    createVMNetwork: !!kubevirtEnabled,
  };

  const sourceStates = Object.values(sources);
  const isLoading = sourceStates.some(
    ({ availability }) => availability === SourceAvailability.Loading,
  );
  const hasReadableSource = sourceStates.some(
    ({ availability }) => availability === SourceAvailability.Available,
  );

  const consumers = consumersSelection
    ? networks.find(({ name }) => name === consumersSelection.networkName)?.consumersByNAD[
        `${consumersSelection.nad.namespace}/${consumersSelection.nad.name}`
      ] || []
    : [];

  return (
    <PageSection>
      <PhysicalNetworksPageHeader
        showCreateButton={actionsEnabled.configure && networks.length > 0}
      />
      <div className="pf-v6-u-mb-md">
        <ScopeSelect onChange={setScope} scope={scope} />
      </div>
      {scope !== ALL_NAMESPACES && (
        <p className="pf-v6-u-mb-md">
          {t(
            'Showing network definitions and consumers in project {{project}}. NMState configuration is cluster-wide.',
            { project: scope },
          )}
        </p>
      )}
      {showGuidance && <NMStateGuidance canInstallOperators={canInstallOperators} />}
      <SourceStateAlerts sources={sources} />
      {isLoading && <Loading />}
      {!isLoading && networks.length === 0 && !hasReadableSource && (
        <ListErrorState error={{ message: t('Physical networks could not be loaded.') }} />
      )}
      {!isLoading && networks.length === 0 && hasReadableSource && (
        <PhysicalNetworksEmptyState showCreateButton={actionsEnabled.configure} />
      )}
      {!isLoading && networks.length > 0 && (
        <PhysicalNetworksTable
          actionsEnabled={actionsEnabled}
          consumersAvailability={consumersAvailability}
          networks={networks}
          onShowConsumers={(nad, networkName) => setConsumersSelection({ nad, networkName })}
          setSelectedConfiguration={setSelectedConfiguration}
          sources={sources}
        />
      )}
      <ConfigurationDrawer
        isOpen={!!selectedConfiguration}
        nmstateFrontendAvailable={!!nmstateFrontendAvailable}
        onClose={() => setSelectedConfiguration(undefined)}
        selectedConfiguration={selectedConfiguration}
      />
      <ConsumersModal
        availability={consumersAvailability}
        consumers={consumers}
        isOpen={!!consumersSelection}
        nad={consumersSelection?.nad}
        onClose={() => setConsumersSelection(undefined)}
      />
    </PageSection>
  );
};

export default PhysicalNetworksPage;
