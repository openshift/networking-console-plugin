import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormSection } from '@patternfly/react-core';
import MatchLabels from '@utils/components/MatchLabels/MatchLabels';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import useProjects from '@utils/hooks/useProjects/useProjects';
import { ClusterUserDefinedNetworkKind } from '@utils/resources/udns/types';
import UDNNamespaceSelectorPreview from '@views/udns/components/UDNNamespaceSelectorPreview';

const ClusterUDNNamespaceSelector: FC = () => {
  const { t } = useNetworkingTranslation();

  const [projects, loaded] = useProjects();

  const { setValue, watch } = useFormContext<ClusterUserDefinedNetworkKind>();

  const matchLabels = watch('spec.namespaceSelector.matchLabels');

  return (
    <FormSection title={t('Namespace(s)')} titleElement="h2">
      <MatchLabels
        matchLabels={matchLabels}
        onChange={(newMatchLabels) =>
          setValue('spec.namespaceSelector.matchLabels', newMatchLabels)
        }
      />

      <UDNNamespaceSelectorPreview
        loaded={loaded}
        matchLabels={matchLabels}
        namespaces={projects}
      />
    </FormSection>
  );
};

export default ClusterUDNNamespaceSelector;
