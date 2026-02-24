import React, { FC, useMemo } from 'react';

import { ResourceYAMLEditor, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title } from '@patternfly/react-core';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY } from '@views/networkpolicies/new/utils/const';

import { generateDefaultNAD } from './utils/constants';
import NetworkAttachmentDefinitionForm from './NetworkAttachmentDefinitionForm';

const NetworkAttachmentDefinitionFormPage: FC = () => {
  const { t } = useNetworkingTranslation();
  const [activeNamespace] = useActiveNamespace();
  const namespace = ALL_NAMESPACES_KEY === activeNamespace ? DEFAULT_NAMESPACE : activeNamespace;

  const initialNAD = useMemo(() => generateDefaultNAD(namespace), [namespace]);

  return (
    <>
      <PageSection>
        <Title headingLevel="h1">{t('Create NetworkAttachmentDefinition')}</Title>
      </PageSection>
      <SyncedEditor
        displayConversionError
        FormEditor={NetworkAttachmentDefinitionForm}
        initialData={initialNAD}
        initialType={EditorType.Form}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
        YAMLEditor={({ initialYAML = '', onChange }) => (
          <ResourceYAMLEditor
            create
            hideHeader
            initialResource={safeYAMLToJS(initialYAML)}
            onChange={onChange}
          />
        )}
      />
    </>
  );
};

export default NetworkAttachmentDefinitionFormPage;
