import React, { FC, useCallback, useMemo } from 'react';

import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { ResourceYAMLEditor, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { Content, ContentVariants, PageSection, Title } from '@patternfly/react-core';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getValidNamespace } from '@utils/utils';
import { LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY } from '@views/networkpolicies/new/utils/const';

import { generateDefaultService } from './utils/utils';
import ServiceForm from './ServiceForm';

type ServiceFormPageProps = {
  serviceToEdit?: IoK8sApiCoreV1Service;
};

const ServiceFormPage: FC<ServiceFormPageProps> = ({ serviceToEdit }) => {
  const { t } = useNetworkingTranslation();
  const [activeNamespace] = useActiveNamespace();
  const namespace = getValidNamespace(activeNamespace);

  const isEditing = Boolean(serviceToEdit);

  const initialService = useMemo(
    () => serviceToEdit || generateDefaultService(namespace),
    [namespace, serviceToEdit],
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
      <PageSection>
        <Title headingLevel="h2">
          {isEditing
            ? t('Edit {{label}}', { label: ServiceModel.label })
            : t('Create {{label}}', { label: ServiceModel.label })}
        </Title>
        <Content component={ContentVariants.p}>
          {t(
            'Create a Service using the form. Switch to YAML view for full control, including fields not shown in the form.',
          )}
        </Content>
      </PageSection>

      <SyncedEditor
        displayConversionError
        FormEditor={ServiceForm}
        initialData={initialService}
        initialType={EditorType.Form}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
        YAMLEditor={YAMLEditor}
      />
    </>
  );
};

export default ServiceFormPage;
