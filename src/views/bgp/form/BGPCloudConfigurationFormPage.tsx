import React, { FC, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';

import {
  modelToGroupVersionKind,
  ResourceYAMLEditor,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title } from '@patternfly/react-core';
import StatusBox from '@utils/components/StatusBox/StatusBox';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel } from '@utils/models';
import { BGPCloudConfiguration } from '@utils/resources/bgp';

import { BGPCloudConfigurationForm } from './BGPForms';

const BGPCloudConfigurationFormPage: FC = () => {
  const { name } = useParams();
  const { t } = useNetworkingTranslation();
  const [resource, loaded, error] = useK8sWatchResource<BGPCloudConfiguration>(
    name
      ? {
          groupVersionKind: modelToGroupVersionKind(BGPCloudConfigurationModel),
          isList: false,
          name,
        }
      : null,
  );
  const initialResource = resource;
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
    <StatusBox error={error} loaded={loaded}>
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
    </StatusBox>
  );
};
export default BGPCloudConfigurationFormPage;
