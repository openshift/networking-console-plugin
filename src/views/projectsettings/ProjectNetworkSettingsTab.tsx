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
  DropdownItem,
  Flex,
  Form,
  FormGroup,
  Label,
  PageSection,
  Spinner,
  Switch,
  Title,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import Select from '@utils/components/Select/Select';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { filterUDNNads, useGlobalNamespaces } from '@utils/resources/nads/helpers';
import { PROJECT_POD_NETWORK_VALUE } from '@utils/resources/namespace/constants';
import { getProjectNetworkSettings } from '@utils/resources/namespace/selectors';
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

  useEffect(() => {
    setBaselineAllowPodNetwork(isPodNetworkAllowed);
    setBaselineDefaultNadName(defaultNadName);
  }, [isPodNetworkAllowed, defaultNadName]);

  const clearApiError = useCallback(() => setApiError(null), []);

  const onReset = useCallback(() => {
    clearApiError();
    setAllowPodNetwork(baselineAllowPodNetwork);
    setPreSelectedNetwork(getPreselectedNetwork(baselineDefaultNadName, baselineAllowPodNetwork));
    setIsSubmitting(false);
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

  const selectedLabel = useMemo(() => {
    if (preSelectedNetwork === PROJECT_POD_NETWORK_VALUE) {
      return t('Pod network');
    }

    return preSelectedNetwork || t('Select a network');
  }, [preSelectedNetwork, t]);

  const nadIsClean =
    baselineDefaultNadName === preSelectedNetwork ||
    (baselineDefaultNadName === undefined && preSelectedNetwork === PROJECT_POD_NETWORK_VALUE);
  const isDirty = allowPodNetwork !== baselineAllowPodNetwork || !nadIsClean;

  const onSave = async () => {
    clearApiError();
    setIsSubmitting(true);

    try {
      await patchProjectNetworkSettings(obj, {
        allowPodNetwork,
        preSelectedNetwork: preSelectedNetwork ?? '',
      });
      // Mark current form values as clean without waiting for the namespace watch.
      setBaselineAllowPodNetwork(allowPodNetwork);
      setBaselineDefaultNadName(
        preSelectedNetwork && preSelectedNetwork !== PROJECT_POD_NETWORK_VALUE
          ? preSelectedNetwork
          : undefined,
      );
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

          <FormGroup fieldId="default-network" label={t('Pre-selected network')}>
            <Select
              id="default-network"
              isDisabled={!canEdit || isSubmitting}
              selected={preSelectedNetwork}
              toggleContent={
                <Flex gap={{ default: 'gapSm' }}>
                  {selectedLabel}
                  {isLoadingNads && <Spinner size="sm" />}
                  {!isLoadingNads && !allowPodNetwork && preSelectedNetwork && (
                    <Label isCompact onClick={() => onSelectNetwork(undefined)}>
                      <TimesIcon aria-label={t('Clear')} />
                    </Label>
                  )}
                </Flex>
              }
            >
              <>
                {allowPodNetwork && (
                  <DropdownItem
                    key={PROJECT_POD_NETWORK_VALUE}
                    onClick={() => onSelectNetwork(PROJECT_POD_NETWORK_VALUE)}
                    value={PROJECT_POD_NETWORK_VALUE}
                  >
                    {t('Pod network')}
                  </DropdownItem>
                )}
                {availableNads
                  .map((nad) =>
                    getNamespace(nad) === projectNamespace
                      ? getName(nad)
                      : `${getNamespace(nad)}/${getName(nad)}`,
                  )
                  .filter((nadName) => nadName !== undefined)
                  .map((nadName) => (
                    <DropdownItem
                      key={nadName}
                      onClick={() => onSelectNetwork(nadName)}
                      value={nadName}
                    >
                      {nadName}
                    </DropdownItem>
                  ))}
              </>
            </Select>
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
                isDisabled={!isDirty || isSubmitting}
                isLoading={isSubmitting}
                onClick={onSave}
                variant={ButtonVariant.primary}
              >
                {t('Save')}
              </Button>
              <Button
                id="reset-network-settings"
                isDisabled={!isDirty || isSubmitting}
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

export default connect(impersonateStateToProps)(ProjectNetworkSettingsTab);
