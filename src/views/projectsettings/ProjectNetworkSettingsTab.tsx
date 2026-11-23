import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { uniq } from 'lodash';

import {
  NamespaceModel,
  NetworkAttachmentDefinitionModelGroupVersionKind,
} from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  K8sResourceCommon,
  useAccessReview,
  useK8sWatchResources,
} from '@openshift-console/dynamic-plugin-sdk';
import { impersonateStateToProps } from '@openshift-console/dynamic-plugin-sdk/lib/app/core/reducers/coreSelectors';
import { ImpersonateKind } from '@openshift-console/dynamic-plugin-sdk/lib/app/redux-types';
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  PageSection,
  Switch,
  Title,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import SelectTypeahead from '@utils/components/SelectTypeahead/SelectTypeahead';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { PROJECT_POD_NETWORK_VALUE } from '@utils/resources/nads/constants';
import { filterUDNNads, useGlobalNamespaces } from '@utils/resources/nads/helpers';
import { getProjectNetworkSettings } from '@utils/resources/nads/selectors';
import { asAccessReview, getName, getNamespace } from '@utils/resources/shared';

import { patchProjectNetworkSettings } from './utils';

type ProjectNetworkSettingsTabProps = {
  impersonate?: ImpersonateKind;
  obj: K8sResourceCommon;
};

const resourceTemplate = {
  groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
  isList: true,
  namespaced: true,
};

const getPreselectedNetwork = (
  defaultNadName: string | undefined,
  isPodNetworkAllowed: boolean,
) => {
  return defaultNadName ?? (isPodNetworkAllowed ? PROJECT_POD_NETWORK_VALUE : undefined);
};

const ProjectNetworkSettingsTab: FC<ProjectNetworkSettingsTabProps> = ({ impersonate, obj }) => {
  const projectNamespace = getName(obj) ?? '';
  const { t } = useNetworkingTranslation();
  const [hasWriteAccess, isLoadingWriteAccess] = useAccessReview(
    asAccessReview(NamespaceModel, obj, 'patch'),
    impersonate,
  );

  const { defaultNadName, isPodNetworkAllowed } = getProjectNetworkSettings(obj);

  const [globalNamespaces, isLoadingGlobalNamespaces] = useGlobalNamespaces(impersonate);

  const initResource = useMemo(() => {
    return Object.fromEntries(
      uniq([projectNamespace, ...globalNamespaces]).map((namespace) => [
        namespace,
        { ...resourceTemplate, namespace },
      ]),
    );
    //globalNamespaces is stable
  }, [projectNamespace, globalNamespaces]);

  const nadsResults = useK8sWatchResources(initResource);

  const isLoadingNads =
    isLoadingGlobalNamespaces || Object.values(nadsResults).some((result) => !result?.loaded);

  const someNadsLoadedWithError =
    !isLoadingNads && Object.values(nadsResults).some((result) => result?.loadError);

  const canEdit = hasWriteAccess && !isLoadingWriteAccess;

  const availableNads = useMemo(
    () =>
      filterUDNNads(
        Object.values(nadsResults).flatMap((result) => result?.data || []) || [],
      ).regular.filter((nad) => getNamespace(nad) && getName(nad)),
    [nadsResults],
  );

  const [allowPodNetwork, setAllowPodNetwork] = useState(isPodNetworkAllowed);
  const [preSelectedNetwork, setPreSelectedNetwork] = useState<string | undefined>(
    getPreselectedNetwork(defaultNadName, isPodNetworkAllowed),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);

  // Baseline for dirty checking. Updated optimistically on save so Save disables
  // immediately, then kept in sync when the watched namespace catches up.
  const [baselineAllowPodNetwork, setBaselineAllowPodNetwork] = useState(isPodNetworkAllowed);
  const [baselineDefaultNadName, setBaselineDefaultNadName] = useState(defaultNadName);
  const [submittedAllowPodNetwork, setSubmittedAllowPodNetwork] = useState<
    { value: boolean } | undefined
  >(undefined);
  const [submittedDefaultNadName, setSubmittedDefaultNadName] = useState<
    { value: string | undefined } | undefined
  >(undefined);
  const [concurrentChange, setConcurrentChange] = useState(false);
  const onCloseResetConcurrentChange = useCallback(() => {
    setConcurrentChange(false);
  }, []);

  useEffect(() => {
    const baselineChanged =
      baselineAllowPodNetwork !== isPodNetworkAllowed || baselineDefaultNadName !== defaultNadName;
    if (!baselineChanged) {
      return;
    }

    setBaselineAllowPodNetwork(isPodNetworkAllowed);
    setBaselineDefaultNadName(defaultNadName);

    const selfSubmitted =
      submittedAllowPodNetwork?.value === isPodNetworkAllowed &&
      submittedDefaultNadName?.value === defaultNadName;
    if (selfSubmitted) {
      setSubmittedAllowPodNetwork(undefined);
      setSubmittedDefaultNadName(undefined);
    } else {
      setConcurrentChange(true);
    }
  }, [
    isPodNetworkAllowed,
    defaultNadName,
    submittedAllowPodNetwork,
    submittedDefaultNadName,
    baselineAllowPodNetwork,
    baselineDefaultNadName,
  ]);

  const clearApiError = useCallback(() => setApiError(null), []);

  const onReset = useCallback(() => {
    clearApiError();
    setAllowPodNetwork(baselineAllowPodNetwork);
    setPreSelectedNetwork(getPreselectedNetwork(baselineDefaultNadName, baselineAllowPodNetwork));
    setIsSubmitting(false);
    setConcurrentChange(false);
  }, [baselineAllowPodNetwork, baselineDefaultNadName, clearApiError]);

  const onAllowPodNetworkChange = useCallback(
    (checked: boolean) => {
      clearApiError();
      setAllowPodNetwork(checked);
      if (preSelectedNetwork === PROJECT_POD_NETWORK_VALUE && !checked) {
        setPreSelectedNetwork(undefined);
      } else if (!preSelectedNetwork && checked) {
        setPreSelectedNetwork(PROJECT_POD_NETWORK_VALUE);
      }
    },
    [clearApiError, preSelectedNetwork],
  );

  const onSelectNetwork = useCallback(
    (network: string | undefined) => {
      clearApiError();
      setPreSelectedNetwork(network);
    },
    [clearApiError],
  );

  const nadIsClean =
    baselineDefaultNadName === preSelectedNetwork ||
    (baselineDefaultNadName === undefined && preSelectedNetwork === PROJECT_POD_NETWORK_VALUE);
  const isDirty = allowPodNetwork !== baselineAllowPodNetwork || !nadIsClean;

  const isWaitingForUpdate =
    submittedAllowPodNetwork?.value === allowPodNetwork &&
    submittedDefaultNadName?.value === preSelectedNetwork;

  const onSave = async () => {
    clearApiError();
    setIsSubmitting(true);

    try {
      const submittedSettings = await patchProjectNetworkSettings(obj, {
        allowPodNetwork,
        preSelectedNetwork: preSelectedNetwork ?? '',
      });
      if (submittedSettings) {
        setSubmittedAllowPodNetwork({ value: submittedSettings.isPodNetworkAllowed });
        setSubmittedDefaultNadName({ value: submittedSettings.defaultNadName });
      }
    } catch (error) {
      setApiError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageSection>
        <Title headingLevel="h2">{t('Network Settings')}</Title>

        <Form isWidthLimited>
          {!canEdit && !isLoadingWriteAccess && (
            <Alert isInline title={t('Read-only')} variant={AlertVariant.info}>
              {t('Patch permission is required to edit project network settings.')}
            </Alert>
          )}
          {apiError && (
            <Alert isInline title={t('Error')} variant={AlertVariant.danger}>
              {apiError.message}
            </Alert>
          )}
          {concurrentChange && (
            <Alert
              actionClose={
                <Button onClick={onCloseResetConcurrentChange} variant={ButtonVariant.link}>
                  {t('Close')}
                </Button>
              }
              isInline
              title={t('Network settings changed')}
              variant={AlertVariant.warning}
            >
              {t('Network settings have been changed in the background')}
            </Alert>
          )}
          {someNadsLoadedWithError && (
            <Alert
              isInline
              title={t('Incomplete network attachment definitions')}
              variant={AlertVariant.warning}
            >
              <p>{t('Failed to load network attachment definitions from namespaces:')}</p>
              <ul>
                {Object.entries(nadsResults)
                  .filter(([, result]) => result?.loadError)
                  .map(([namespace]) => (
                    <li key={namespace}>{namespace}</li>
                  ))}
              </ul>
            </Alert>
          )}
        </Form>
      </PageSection>
      <PageSection>
        <Form isWidthLimited>
          <FormGroup fieldId="allow-pod-network">
            <Switch
              aria-label={t('Show Pod network option')}
              id="allow-pod-network"
              isChecked={allowPodNetwork}
              isDisabled={!canEdit || isSubmitting}
              label={t('Show Pod network option')}
              onChange={(_, checked) => onAllowPodNetworkChange(checked)}
            />
            <FormGroupHelperText>
              {t(
                'When enabled, Pod network will be visible in the UI as one of the network options.',
              )}
            </FormGroupHelperText>
          </FormGroup>

          <FormGroup fieldId="toggle-default-network" label={t('Pre-selected network')}>
            <SelectTypeahead
              isDisabled={!canEdit || isSubmitting}
              isLoading={isLoadingNads}
              options={[
                {
                  label: t('Pod network'),
                  optionProps: { isDisabled: !allowPodNetwork },
                  value: PROJECT_POD_NETWORK_VALUE,
                },
                ...availableNads
                  .map((nad) =>
                    getNamespace(nad) === projectNamespace
                      ? getName(nad)
                      : `${getNamespace(nad)}/${getName(nad)}`,
                  )
                  .filter((nadName): nadName is string => nadName !== undefined)
                  .map((nadName) => ({
                    value: nadName,
                  })),
              ]}
              placeholder={t('Select a network')}
              selectedValue={preSelectedNetwork}
              setSelectedValue={(newSelection) => onSelectNetwork(newSelection)}
              toggleId="toggle-default-network"
            />

            <FormGroupHelperText>
              {t(
                'The network that will be pre-selected for VirtualMachines created in this project.',
              )}
            </FormGroupHelperText>
          </FormGroup>

          {canEdit && (
            <ActionGroup>
              <Button
                id="save-network-settings"
                isDisabled={!isDirty || isSubmitting || isWaitingForUpdate}
                isLoading={isSubmitting}
                onClick={onSave}
                variant={ButtonVariant.primary}
              >
                {t('Save')}
              </Button>
              <Button
                id="reset-network-settings"
                isDisabled={!isDirty || isSubmitting || isWaitingForUpdate}
                onClick={onReset}
                variant={ButtonVariant.secondary}
              >
                {t('Cancel')}
              </Button>
            </ActionGroup>
          )}
        </Form>
      </PageSection>
    </>
  );
};

export const TestComponent = ProjectNetworkSettingsTab;

export default connect(impersonateStateToProps)(ProjectNetworkSettingsTab);
