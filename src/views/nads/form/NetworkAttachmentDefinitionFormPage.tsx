import React, { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import NetworkAttachmentDefinitionModel from '@kubevirt-ui/kubevirt-api/console/models/NetworkAttachmentDefinitionModel';
import {
  k8sCreate,
  ResourceYAMLEditor,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert, AlertVariant, PageSection, Title } from '@patternfly/react-core';
import { EditorType } from '@utils/components/SyncedEditor/EditorToggle';
import { SyncedEditor } from '@utils/components/SyncedEditor/SyncedEditor';
import { safeYAMLToJS } from '@utils/components/SyncedEditor/yaml';
import { ALL_NAMESPACES_KEY, DEFAULT_NAMESPACE } from '@utils/constants';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace, resourcePathFromModel } from '@utils/resources/shared';

import useOVNBridgeMappings from './hooks/useOVNBridgeMappings';
import { generateDefaultNAD } from './utils/constants';
import { CreateNADYAMLEditorProps } from './utils/types';
import { getBridgeMappingError } from './utils/utils';
import NetworkAttachmentDefinitionForm from './NetworkAttachmentDefinitionForm';

const CreateNADYAMLEditor: FC<CreateNADYAMLEditorProps> = ({ initialYAML = '', onChange }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const physicalNetworkNames = useOVNBridgeMappings();
  const [error, setError] = useState<string>();

  const onSave = async (content: string) => {
    const mappingError = getBridgeMappingError(content, physicalNetworkNames, t);

    if (mappingError) {
      setError(`${t('Error')} "${mappingError}"`);
      return;
    }

    try {
      const created = await k8sCreate({
        data: safeYAMLToJS(content),
        model: NetworkAttachmentDefinitionModel,
      });

      navigate(
        resourcePathFromModel(
          NetworkAttachmentDefinitionModel,
          getName(created),
          getNamespace(created),
        ),
      );
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  return (
    <>
      {error && (
        <PageSection>
          <Alert isInline title={t('An error occurred.')} variant={AlertVariant.danger}>
            {error}
          </Alert>
        </PageSection>
      )}
      <ResourceYAMLEditor
        create
        hideHeader
        initialResource={safeYAMLToJS(initialYAML)}
        onChange={(yaml) => {
          onChange?.(yaml);
          setError(undefined);
        }}
        onSave={onSave}
      />
    </>
  );
};

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
        forceInitialType
        FormEditor={NetworkAttachmentDefinitionForm}
        initialData={initialNAD}
        initialType={EditorType.Form}
        lastViewUserSettingKey="console.createNetworkAttachmentDefinition.editor.lastView"
        YAMLEditor={CreateNADYAMLEditor}
      />
    </>
  );
};

export default NetworkAttachmentDefinitionFormPage;
