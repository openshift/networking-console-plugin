const isOLMResourcePage = (pathname?: string) =>
  pathname?.includes('operators.coreos.com~v1alpha1~ClusterServiceVersion') || false;

const BGP_NETWORKING_LIST_PATHS = [
  '/k8s/cluster/networking.openshift.io~v1beta1~BGPCloudConfiguration',
  '/k8s/cluster/networking.openshift.io~v1beta1~BGPRouting',
];

export const isBGPNetworkingListPage = (pathname: string) =>
  BGP_NETWORKING_LIST_PATHS.includes(pathname);

export const shouldHideBGPResourceTabs = (pathname: string) => {
  if (isOLMResourcePage(pathname)) return true;
  if (typeof window === 'undefined') return false;

  const paths = [window.location.pathname, document.referrer];

  // OLM can render plugin pages in a nested console context. In that case the
  // local router pathname is not the URL shown in the browser.
  try {
    paths.push(window.top?.location.pathname || '');
  } catch {
    // Access to the top-level location can be denied when the console is embedded.
  }

  return paths.some(isOLMResourcePage);
};
