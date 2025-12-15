const UPSTREAM_LATEST = 'https://docs.okd.io/latest/';
const REDHAT_DOC_BASE =
  'https://docs.redhat.com/en/documentation/openshift_container_platform/latest/';

// Use latest upstream docs if branding is 'okd', but fall back to Red Hat documentation.
export const openshiftHelpBase =
  window.SERVER_FLAGS.documentationBaseURL ||
  (window.SERVER_FLAGS.branding === 'okd' ? UPSTREAM_LATEST : REDHAT_DOC_BASE);

export const DOC_URL_OPENSHIFT_WHATS_NEW = 'https://www.openshift.com/learn/whats-new';
export const DOC_URL_OPERATORFRAMEWORK_SDK = 'https://sdk.operatorframework.io/';
export const DOC_URL_PODDISRUPTIONBUDGET_POLICY = `${UPSTREAM_LATEST}rest_api/policy_apis/poddisruptionbudget-policy-v1.html#poddisruptionbudget-policy-v1`;
export const DOC_URL_PODMAN = 'https://podman.io/';
export const DOC_URL_RED_HAT_MARKETPLACE =
  'https://marketplace.redhat.com/en-us?utm_source=openshift_console';

const KUBE_DOCS = 'https://kubernetes.io/docs/';
export const DOC_URL_STORAGE_CLASSES_AWS_EBS = `${KUBE_DOCS}/concepts/storage/storage-classes/#aws-ebs`;
export const DOC_URL_STORAGE_CLASSES_AZURE_DISK = `${KUBE_DOCS}/concepts/storage/storage-classes/#azure-disk`;
export const DOC_URL_STORAGE_CLASSES_AZURE_FILE = `${KUBE_DOCS}/concepts/storage/storage-classes/#azure-file`;
export const DOC_URL_STORAGE_CLASSES_GCE = `${KUBE_DOCS}/concepts/storage/storage-classes/#gce`;
export const DOC_URL_STORAGE_CLASSES_GLUSTERFS = `${KUBE_DOCS}/concepts/storage/storage-classes/#glusterfs`;
export const DOC_URL_STORAGE_CLASSES_LOCAL = `${KUBE_DOCS}/concepts/storage/storage-classes/#local`;
export const DOC_URL_STORAGE_CLASSES_OPENSTACK_CINDER = `${KUBE_DOCS}/concepts/storage/storage-classes/#openstack-cinder`;
export const DOC_URL_STORAGE_CLASSES_PORTWORX_VOLUME = `${KUBE_DOCS}/concepts/storage/storage-classes/#portworx-volume`;
export const DOC_URL_STORAGE_CLASSES_QUOBYTE = `${KUBE_DOCS}/concepts/storage/storage-classes/#quobyte`;
export const DOC_URL_STORAGE_CLASSES_SCALEIO = `${KUBE_DOCS}/concepts/storage/storage-classes/#scaleio`;
export const DOC_URL_STORAGE_CLASSES_STORAGEOS = `${KUBE_DOCS}/concepts/storage/storage-classes/#storageos`;
export const DOC_URL_STORAGE_CLASSES_VSPHERE = `${KUBE_DOCS}/concepts/storage/storage-classes/#vsphere`;

export const DOC_URL_NETWORK_SERVICE = `${KUBE_DOCS}/concepts/services-networking/service/`;
export const DOC_URL_NETWORK_INGRESS = `${KUBE_DOCS}/concepts/services-networking/ingress/`;

export const documentationURLs: documentationURLsType = {
  multipleNetworks: {
    downstream: 'html/multiple_networks/understanding-multiple-networks',
    upstream: 'networking/multiple_networks/understanding-multiple-networks.html',
  },
  networkPolicy: {
    downstream: 'html/network_security/network-policy#about-network-policy',
    kube: `${KUBE_DOCS}/concepts/services-networking/network-policies/`,
    upstream: 'networking/network_security/network_policy/about-network-policy.html',
  },
  primaryUDN: {
    downstream: 'html/virtualization/networking#virt-connecting-vm-to-primary-udn',
    upstream: 'networking/multiple_networks/primary_networks/about-user-defined-networks.html',
  },
  routes: {
    downstream: 'html/ingress_and_load_balancing/routes',
    upstream: 'networking/ingress_load_balancing/routes/nw-configuring-routes.html',
  },
  vmNetworking: {
    downstream: 'html/virtualization/networking',
    upstream: 'networking/networking_overview/understanding-networking.html',
  },
  workingWithProjects: {
    downstream: 'html/building_applications/projects#working-with-projects',
    upstream: 'applications/projects/working-with-projects.html',
  },
};

export const isUpstream = () =>
  window.SERVER_FLAGS.branding === 'okd' || openshiftHelpBase === UPSTREAM_LATEST;

export const isManaged = () =>
  window.SERVER_FLAGS.branding === 'rosa' || window.SERVER_FLAGS.branding === 'dedicated';

export const getDocumentationURL = (docURLs: docURLs) =>
  isUpstream()
    ? `${UPSTREAM_LATEST}${docURLs.upstream}`
    : `${openshiftHelpBase}${docURLs.downstream}`;

export const getNetworkPolicyDocURL = (openshiftFlag: boolean): string => {
  const networkLink = getDocumentationURL(documentationURLs.networkPolicy);

  return openshiftFlag ? networkLink : documentationURLs.networkPolicy.kube;
};

type documentationURLsType = {
  [key: string]: docURLs;
};

type docURLs = {
  downstream: string;
  kube?: string;
  upstream: string;
};
