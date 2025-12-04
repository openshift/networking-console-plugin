import React, { FC, useCallback, useMemo } from 'react';

import { RouteModel } from '@kubevirt-ui/kubevirt-api/console';
import { ResourceYAMLEditor, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { Content, ContentVariants, PageSection, Title } from '@patternfly/react-core';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteKind } from '@utils/types';
import { getValidNamespace } from '@utils/utils';
import { LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY } from '@views/networkpolicies/new/utils/const';

import RouteForm from './RouteForm';
import { generateDefaultRoute } from './utils';

import './networking-route-form.scss';

type RouteFormPageProps = { initialRoute?: RouteKind };

const RouteFormPage: FC<RouteFormPageProps> = ({ initialRoute }) => {
  const { t } = useNetworkingTranslation();

  const isEditing = Boolean(initialRoute);

  const [activeNamespace] = useActiveNamespace();
  const namespace = getValidNamespace(activeNamespace);

  const k8sObj = useMemo(
    () => initialRoute || generateDefaultRoute(namespace),
    [initialRoute, namespace],
  );

  const YAMLEditor = useCallback(
    ({ initialYAML = '', onChange }) => (
      <ResourceYAMLEditor
        create={!isEditing}
        hideHeader
        initialResource={safeYAMLToJS(initialYAML)}
        onChange={onChange}
      />
    ),
    [isEditing],
  );

  return (
    <>
      <PageSection className="networking-route-form">
        <Title headingLevel="h2">
          {isEditing
            ? t('Edit {{label}}', { label: RouteModel.label })
            : t('Create {{label}}', { label: RouteModel.label })}
        </Title>
        <Content component={ContentVariants.p}>
          {t('Routing is a way to make your application publicly visible')}
        </Content>
      </PageSection>

      <SyncedEditor
        displayConversionError
        FormEditor={RouteForm}
        initialData={k8sObj}
        initialType={EditorType.Form}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
        YAMLEditor={YAMLEditor}
      />
    </>
  );
};

export default RouteFormPage;
