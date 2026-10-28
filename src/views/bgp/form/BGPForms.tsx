import React, { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { modelToGroupVersionKind, NamespaceModel } from '@kubevirt-ui-ext/kubevirt-api/console';
import {
  k8sCreate,
  K8sResourceKind,
  k8sUpdate,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  FormSection,
  Grid,
  GridItem,
  MenuToggle,
  PageSection,
  TextInput,
} from '@patternfly/react-core';
import FormGroupHelperText from '@utils/components/FormGroupHelperText/FormGroupHelperText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { BGPCloudConfigurationModel, BGPRoutingModel } from '@utils/models';
import { BGPCloudConfiguration, BGPRouting, isCIDR, parseSelector } from '@utils/resources/bgp';
import { getName, resourcePathFromModel } from '@utils/resources/shared';

export type BGPFormProps<T extends K8sResourceKind> = { formData: T; onChange: (data: T) => void };
type FieldProps = {
  error?: string;
  help?: string;
  id: string;
  label: string;
  placeholder?: string;
  register: any;
  required?: boolean;
  validate?: (value: number | string) => boolean | string;
};
const Field: FC<FieldProps> = ({
  error,
  help,
  id,
  label,
  placeholder,
  register,
  required,
  validate,
}) => (
  <FormGroup fieldId={id} isRequired={required} label={label}>
    <TextInput id={id} placeholder={placeholder} {...register(id, { required, validate })} />
    <FormGroupHelperText>{error || help}</FormGroupHelperText>
  </FormGroup>
);

const BGPSelect: FC<{
  help?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  value: string;
}> = ({ help, id, label, onChange, options, required, value }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <FormGroup fieldId={id} isInline isRequired={required} label={label}>
      <Dropdown
        id={id}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle isExpanded={isOpen} onClick={() => setIsOpen(!isOpen)} ref={toggleRef}>
            {selected?.label || value}
          </MenuToggle>
        )}
      >
        <DropdownList>
          {options.map((option) => (
            <DropdownItem
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
      <FormGroupHelperText>{help}</FormGroupHelperText>
    </FormGroup>
  );
};

type CloudValues = {
  livenessDetection: 'bfd' | 'bgp-keepalive';
  localASN: number | string;
  platform: 'AWS' | 'Azure' | 'GCP' | 'Manual';
  routerSelectorKey: string;
  routerSelectorValue: string;
} & Record<string, any>;
const firstSelector = (selector?: Record<string, string>) =>
  Object.entries(selector || {})[0] || ['', ''];
const cloudPayload = (data: CloudValues): BGPCloudConfiguration => {
  const spec: BGPCloudConfiguration['spec'] = {
    bgp: { livenessDetection: data.livenessDetection, localASN: Number(data.localASN) },
    platform: data.platform,
    routerNodeSelector: parseSelector(`${data.routerSelectorKey}=${data.routerSelectorValue}`),
  };
  if (data.platform === 'AWS')
    spec.aws = {
      region: data.awsRegion,
      routeServerIDs: data.awsRouteServerIDs
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean),
    };
  if (data.platform === 'Azure')
    spec.azure = {
      resourceGroup: data.azureResourceGroup,
      routeServerName: data.azureRouteServerName,
      subscriptionID: data.azureSubscriptionID,
    };
  if (data.platform === 'GCP')
    spec.gcp = {
      cloudRouterName: data.cloudRouterName,
      enableNestedVirtualization: data.enableNestedVirtualization,
      ncc: { hubName: data.gcpNCCHubName, spokePrefix: data.gcpNCCSpokePrefix },
      project: data.gcpProject,
      region: data.gcpRegion,
    };
  if (data.platform === 'Manual')
    spec.bgp.peerGroups = [
      {
        neighbors: [
          {
            address: data.neighborAddress,
            ebgpMultiHop: data.ebgpMultiHop,
            remoteASN: Number(data.remoteASN),
          },
        ],
        nodeSelector: parseSelector(`${data.peerSelectorKey}=${data.peerSelectorValue}`),
      },
    ];
  return {
    apiVersion: 'networking.openshift.io/v1beta1',
    kind: 'BGPCloudConfiguration',
    metadata: { name: 'cluster' },
    spec,
  };
};

export const BGPCloudConfigurationForm: FC<BGPFormProps<BGPCloudConfiguration>> = ({
  formData,
  onChange,
}) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<Error>();
  const [routerKey, routerValue] = firstSelector(formData.spec?.routerNodeSelector);
  const [peerKey, peerValue] = firstSelector(formData.spec?.bgp?.peerGroups?.[0]?.nodeSelector);
  const neighbor = formData.spec?.bgp?.peerGroups?.[0]?.neighbors?.[0];
  const methods = useForm<CloudValues>({
    defaultValues: {
      awsRegion: formData.spec?.aws?.region || '',
      awsRouteServerIDs: formData.spec?.aws?.routeServerIDs?.join(', ') || '',
      azureResourceGroup: formData.spec?.azure?.resourceGroup || '',
      azureRouteServerName: formData.spec?.azure?.routeServerName || '',
      azureSubscriptionID: formData.spec?.azure?.subscriptionID || '',
      cloudRouterName: formData.spec?.gcp?.cloudRouterName || '',
      ebgpMultiHop: neighbor?.ebgpMultiHop || false,
      enableNestedVirtualization: formData.spec?.gcp?.enableNestedVirtualization ?? true,
      gcpNCCHubName: formData.spec?.gcp?.ncc?.hubName || '',
      gcpNCCSpokePrefix: formData.spec?.gcp?.ncc?.spokePrefix || '',
      gcpProject: formData.spec?.gcp?.project || '',
      gcpRegion: formData.spec?.gcp?.region || '',
      livenessDetection: formData.spec?.bgp?.livenessDetection || 'bgp-keepalive',
      localASN: formData.spec?.bgp?.localASN || '',
      neighborAddress: neighbor?.address || '',
      peerSelectorKey: peerKey,
      peerSelectorValue: peerValue,
      platform: formData.spec?.platform || 'AWS',
      remoteASN: neighbor?.remoteASN || '',
      routerSelectorKey: routerKey,
      routerSelectorValue: routerValue,
    },
    mode: 'onChange',
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = methods;
  const values = watch();
  const platform = values.platform;
  useEffect(() => onChange(cloudPayload(values)), [onChange, values]);
  const submit = async (data: CloudValues) => {
    try {
      const payload = cloudPayload(data);
      await (formData.metadata?.resourceVersion
        ? k8sUpdate({ data: payload, model: BGPCloudConfigurationModel, name: 'cluster' })
        : k8sCreate({ data: payload, model: BGPCloudConfigurationModel }));
      navigate(resourcePathFromModel(BGPCloudConfigurationModel, 'cluster'));
    } catch (err) {
      setError(err as Error);
    }
  };
  return (
    <PageSection>
      <Form onSubmit={handleSubmit(submit)}>
        <FormGroup fieldId="name" label={t('Name')}>
          <TextInput aria-label={t('Name')} id="name" isDisabled value="cluster" />
          <FormGroupHelperText>
            {t('This cluster-wide singleton is always named cluster.')}
          </FormGroupHelperText>
        </FormGroup>
        <Field
          help={t('Example: 64512.')}
          id="localASN"
          label={t('Local ASN')}
          placeholder="64512"
          register={register}
          required
        />
        <BGPSelect
          help={t('BFD detects failures quickly; BGP keepalive uses standard BGP timers.')}
          id="livenessDetection"
          label={t('Liveness detection')}
          onChange={(value) =>
            methods.setValue('livenessDetection', value as CloudValues['livenessDetection'], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          options={[
            { label: t('BGP keepalive'), value: 'bgp-keepalive' },
            { label: 'BFD', value: 'bfd' },
          ]}
          required
          value={values.livenessDetection}
        />
        <BGPSelect
          help={t('Select the cloud integration used to discover BGP peers.')}
          id="platform"
          label={t('Platform')}
          onChange={(value) =>
            methods.setValue('platform', value as CloudValues['platform'], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          options={['AWS', 'Azure', 'GCP', 'Manual'].map((value) => ({ label: value, value }))}
          required
          value={values.platform}
        />
        <Card>
          <CardTitle component="h3">{t('{{platform}} configuration', { platform })}</CardTitle>
          <CardBody>
            {platform === 'AWS' && (
              <FormSection>
                <Field
                  id="awsRegion"
                  label={t('Region')}
                  placeholder="us-east-1"
                  register={register}
                  required
                />
                <Field
                  id="awsRouteServerIDs"
                  label={t('VPC Route Server IDs')}
                  placeholder="rs-0123456789abcdef0"
                  register={register}
                  required
                />
              </FormSection>
            )}
            {platform === 'Azure' && (
              <FormSection>
                <Field
                  id="azureSubscriptionID"
                  label={t('Subscription ID')}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  register={register}
                  required
                />
                <Field
                  id="azureResourceGroup"
                  label={t('Resource group')}
                  placeholder="networking-rg"
                  register={register}
                  required
                />
                <Field
                  id="azureRouteServerName"
                  label={t('Route Server name')}
                  placeholder="route-server"
                  register={register}
                  required
                />
              </FormSection>
            )}
            {platform === 'GCP' && (
              <FormSection>
                <Field
                  id="gcpProject"
                  label={t('Project')}
                  placeholder="my-gcp-project"
                  register={register}
                  required
                />
                <Field
                  id="gcpRegion"
                  label={t('Region')}
                  placeholder="us-central1"
                  register={register}
                  required
                />
                <Field
                  id="cloudRouterName"
                  label={t('Cloud Router name')}
                  placeholder="bgp-router"
                  register={register}
                  required
                />
                <Field
                  id="gcpNCCHubName"
                  label={t('NCC hub name')}
                  placeholder="projects/123/locations/global/hubs/hub-1"
                  register={register}
                  required
                />
                <Field
                  id="gcpNCCSpokePrefix"
                  label={t('NCC spoke prefix')}
                  placeholder="bgp-spoke"
                  register={register}
                  required
                />
                <label>
                  <input type="checkbox" {...register('enableNestedVirtualization')} />{' '}
                  {t('Enable nested virtualization; this may restart GCP instances.')}
                </label>
              </FormSection>
            )}
            {platform === 'Manual' && (
              <FormSection title={t('Manual peer group')}>
                <Field
                  id="peerSelectorKey"
                  label={t('Peer-group selector key')}
                  placeholder="node-role.kubernetes.io/bgp"
                  register={register}
                  required
                />
                <Field
                  id="peerSelectorValue"
                  label={t('Peer-group selector value')}
                  placeholder="router"
                  register={register}
                  required
                />
                <Field
                  id="neighborAddress"
                  label={t('Neighbor address')}
                  placeholder="192.0.2.1 or 2001:db8::1"
                  register={register}
                  required
                />
                <Field
                  id="remoteASN"
                  label={t('Remote ASN')}
                  placeholder="64513"
                  register={register}
                  required
                />
                <label>
                  <input type="checkbox" {...register('ebgpMultiHop')} />{' '}
                  {t('Enable eBGP multihop')}
                </label>
              </FormSection>
            )}
          </CardBody>
        </Card>
        <FormSection title={t('Router node selector')}>
          <Grid hasGutter>
            <GridItem span={6}>
              <Field
                id="routerSelectorKey"
                label={t('Key')}
                placeholder="node-role.kubernetes.io/bgp"
                register={register}
                required
              />
            </GridItem>
            <GridItem span={6}>
              <Field
                id="routerSelectorValue"
                label={t('Value')}
                placeholder="router"
                register={register}
                required
              />
            </GridItem>
          </Grid>
          <FormGroupHelperText>
            {t(
              'Router node selectors identify nodes that establish BGP sessions. Changing them can affect peering and routing availability.',
            )}
          </FormGroupHelperText>
        </FormSection>
        {error && (
          <Alert isInline title={t('Error')} variant={AlertVariant.danger}>
            {error.message}
          </Alert>
        )}
        <ActionGroup>
          <Button
            isDisabled={isSubmitting || Boolean(Object.keys(errors).length)}
            isLoading={isSubmitting}
            type="submit"
            variant={ButtonVariant.primary}
          >
            {t('Save')}
          </Button>
          <Button onClick={() => navigate(-1)} type="button" variant={ButtonVariant.secondary}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </Form>
    </PageSection>
  );
};

export const BGPRoutingForm: FC<BGPFormProps<BGPRouting>> = ({ formData, onChange }) => {
  const { t } = useNetworkingTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<Error>();
  const methods = useForm({
    defaultValues: {
      name: getName(formData) || '',
      network: formData.spec?.network?.name || '',
      subnet1: formData.spec?.network?.subnets?.[0] || '',
      subnet2: formData.spec?.network?.subnets?.[1] || '',
    },
    mode: 'onChange',
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = methods;
  const values = watch();
  const [matchingNamespaces, matchingNamespacesLoaded] = useK8sWatchResource<K8sResourceKind[]>(
    values.network
      ? {
          groupVersionKind: modelToGroupVersionKind(NamespaceModel),
          isList: true,
          selector: {
            matchLabels: {
              'cluster-udn': values.network,
              'k8s.ovn.org/primary-user-defined-network': '',
            },
          },
        }
      : null,
  );
  let subnetError: string;
  if (values.subnet1 && !isCIDR(values.subnet1))
    subnetError = t('Enter a valid IPv4 or IPv6 CIDR.');
  else if (values.subnet2 && !isCIDR(values.subnet2))
    subnetError = t('Enter a valid IPv4 or IPv6 CIDR.');
  useEffect(
    () =>
      onChange({
        apiVersion: 'networking.openshift.io/v1beta1',
        kind: 'BGPRouting',
        metadata: { name: values.name },
        spec: {
          network: {
            name: values.network,
            subnets: [values.subnet1, values.subnet2].filter(Boolean),
          },
        },
      }),
    [onChange, values],
  );
  const submit = async (data: any) => {
    if (subnetError) return;
    try {
      const payload = {
        apiVersion: 'networking.openshift.io/v1beta1',
        kind: 'BGPRouting',
        metadata: { name: data.name },
        spec: {
          network: { name: data.network, subnets: [data.subnet1, data.subnet2].filter(Boolean) },
        },
      };
      await (formData.metadata?.resourceVersion
        ? k8sUpdate({ data: payload, model: BGPRoutingModel, name: data.name })
        : k8sCreate({ data: payload, model: BGPRoutingModel }));
      navigate(resourcePathFromModel(BGPRoutingModel, data.name));
    } catch (err) {
      setError(err as Error);
    }
  };
  return (
    <PageSection>
      <Form onSubmit={handleSubmit(submit)}>
        <Field
          id="name"
          label={t('Resource name')}
          placeholder="prod-routing"
          register={register}
          required
        />
        <Field
          help={t(
            'The operator creates a ClusterUserDefinedNetwork; this resource does not configure BGP peers.',
          )}
          id="network"
          label={t('Network name')}
          placeholder="prod"
          register={register}
          required
        />
        <FormSection title={t('Advertised subnets')}>
          <Field
            error={subnetError}
            id="subnet1"
            label={t('Subnet CIDR 1')}
            placeholder="10.20.0.0/16"
            register={register}
            required
          />
          <Field
            error={subnetError}
            help={t('Optional second subnet for dual-stack; maximum two subnets.')}
            id="subnet2"
            label={t('Subnet CIDR 2')}
            placeholder="2001:db8:20::/64"
            register={register}
          />
        </FormSection>
        <Alert isInline title={t('Namespace preparation')} variant={AlertVariant.info}>
          <p>
            {matchingNamespacesLoaded && matchingNamespaces?.length
              ? t('Found {{count}} matching namespaces: {{namespaces}}.', {
                  count: matchingNamespaces.length,
                  namespaces: matchingNamespaces
                    .map((namespace) => namespace.metadata?.name)
                    .filter(Boolean)
                    .join(', '),
                })
              : t('No namespaces currently match these labels.')}
          </p>
          <p>{t('To add more namespaces, enter each label in a separate key/value row:')}</p>
          <div>
            <code>{`cluster-udn=${values.network || '<network-name>'}`}</code>
          </div>
          <div>
            <code>k8s.ovn.org/primary-user-defined-network</code>
          </div>
        </Alert>
        {error && (
          <Alert isInline title={t('Error')} variant={AlertVariant.danger}>
            {error.message}
          </Alert>
        )}
        <ActionGroup>
          <Button
            isDisabled={isSubmitting || Boolean(subnetError) || Boolean(Object.keys(errors).length)}
            isLoading={isSubmitting}
            type="submit"
            variant={ButtonVariant.primary}
          >
            {t('Save')}
          </Button>
          <Button onClick={() => navigate(-1)} type="button" variant={ButtonVariant.secondary}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </Form>
    </PageSection>
  );
};
