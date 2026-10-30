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
import { BGPRoutingModel } from '@utils/models';
import { BGPRouting } from '@utils/resources/bgp';

import { BGPRoutingForm } from './BGPForms';

const BGPRoutingFormPage: FC = () => {
  const { name } = useParams();
  const { t } = useNetworkingTranslation();
  const [resource, loaded, error] = useK8sWatchResource<BGPRouting>(
    name
      ? {
          groupVersionKind: modelToGroupVersionKind(BGPRoutingModel),
          isList: false,
          name,
        }
      : null,
  );
  const initialResource = resource;
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
    <StatusBox error={error} loaded={loaded}>
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
    </StatusBox>
  );
};
export default BGPRoutingFormPage;
