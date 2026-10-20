import {
  IoK8sApiNetworkingV1Ingress,
  IoK8sApiNetworkingV1IngressRule,
} from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { get, isString } from '@utils/utils';

export const ingressValidHosts = (ingress: IoK8sApiNetworkingV1Ingress) =>
  get(ingress, 'spec.rules', [])
    .map((rule: IoK8sApiNetworkingV1IngressRule) => rule?.host)
    .filter(isString);

export const getHostsStr = (ingress: IoK8sApiNetworkingV1Ingress) => {
  const hosts = ingressValidHosts(ingress);
  const hostsStr = hosts.join(', ');

  return hosts?.length ? hostsStr : null;
};

export const sortIngressesByHosts =
  (direction: string) => (a: IoK8sApiNetworkingV1Ingress, b: IoK8sApiNetworkingV1Ingress) => {
    const { first, second } =
      direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

    const firstHosts = getHostsStr(first);
    const secondHosts = getHostsStr(second);

    return firstHosts?.localeCompare(secondHosts, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };
