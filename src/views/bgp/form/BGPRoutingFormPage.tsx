import React, { FC, useCallback, useMemo } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title } from '@patternfly/react-core';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPRouting } from '@utils/resources/bgp';

import { BGPRoutingForm } from './BGPForms';

const BGPRoutingFormPage: FC<{ initialResource?: BGPRouting }> = ({ initialResource }) => {
  const { t } = useNetworkingTranslation();
  const data = useMemo<BGPRouting>(
    () =>
      initialResource || {
        apiVersion: 'networking.openshift.io/v1beta1',
        kind: 'BGPRouting',
        metadata: { name: '' },
        spec: { network: { name: '', subnets: [] } },
      },
    [initialResource],
  );
  const YAMLEditor = useCallback(
    ({ initialYAML = '', onChange }) => (
      <ResourceYAMLEditor
        create={!initialResource}
        hideHeader
        initialResource={safeYAMLToJS(initialYAML)}
        onChange={onChange}
      />
    ),
    [initialResource],
  );
  return (
    <>
      <PageSection>
        <Title headingLevel="h1">
          {initialResource ? t('Edit BGPRouting') : t('Create BGPRouting')}
        </Title>
      </PageSection>
      <SyncedEditor
        displayConversionError
        FormEditor={BGPRoutingForm}
        initialData={data}
        initialType={EditorType.Form}
        lastViewUserSettingKey="console.bgpRouting.editor.lastView"
        YAMLEditor={YAMLEditor}
      />
    </>
  );
};
export default BGPRoutingFormPage;
