import React, { FC, useCallback, useMemo } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title } from '@patternfly/react-core';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfiguration } from '@utils/resources/bgp';

import { BGPCloudConfigurationForm } from './BGPForms';

const BGPCloudConfigurationFormPage: FC<{ initialResource?: BGPCloudConfiguration }> = ({
  initialResource,
}) => {
  const { t } = useNetworkingTranslation();
  const data = useMemo<BGPCloudConfiguration>(
    () =>
      initialResource || {
        apiVersion: 'networking.openshift.io/v1beta1',
        kind: 'BGPCloudConfiguration',
        metadata: { name: 'cluster' },
        spec: { bgp: { localASN: 0 }, platform: 'AWS', routerNodeSelector: {} },
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
          {initialResource ? t('Edit BGPCloudConfiguration') : t('Create BGPCloudConfiguration')}
        </Title>
      </PageSection>
      <SyncedEditor
        displayConversionError
        FormEditor={BGPCloudConfigurationForm}
        initialData={data}
        initialType={EditorType.Form}
        lastViewUserSettingKey="console.bgpCloudConfiguration.editor.lastView"
        YAMLEditor={YAMLEditor}
      />
    </>
  );
};
export default BGPCloudConfigurationFormPage;
