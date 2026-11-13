const isOLMResourcePage = (pathname?: string) =>
  pathname?.includes('operators.coreos.com~v1alpha1~ClusterServiceVersion') || false;

const BGP_NETWORKING_LIST_PATHS = [
  '/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration',
  '/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting',
];

export const isBGPNetworkingListPage = (pathname: string) =>
  BGP_NETWORKING_LIST_PATHS.includes(pathname);

export const shouldHideBGPResourceTabs = () => {
  if (typeof window === 'undefined') return false;

  try {
    return isOLMResourcePage(window.top?.location.pathname);
  } catch {
    // Access to the top-level location can be denied when the console is embedded.
    return isOLMResourcePage(document.referrer);
  }
};
