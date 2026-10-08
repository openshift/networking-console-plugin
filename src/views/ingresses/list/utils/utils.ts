import { Ingress, IngressRule } from '@utils/types/k8sTypes';
import { get, isString } from '@utils/utils';

export const ingressValidHosts = (ingress: Ingress) =>
  get(ingress, 'spec.rules', [])
    .map((rule: IngressRule) => rule?.host)
    .filter(isString);

export const getHostsStr = (ingress: Ingress) => {
  const hosts = ingressValidHosts(ingress);
  const hostsStr = hosts.join(', ');

  return hosts?.length ? hostsStr : null;
};

export const sortIngressesByHosts = (direction: string) => (a: Ingress, b: Ingress) => {
  const { first, second } = direction === 'asc' ? { first: a, second: b } : { first: b, second: a };

  const firstHosts = getHostsStr(first);
  const secondHosts = getHostsStr(second);

  return firstHosts?.localeCompare(secondHosts, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};
