import React, { FC } from 'react';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import MutedText from '@utils/components/MutedText/MutedText';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const ServiceAddress: FC<{ service: IoK8sApiCoreV1Service }> = ({ service }) => {
  const { t } = useNetworkingTranslation();

  const ServiceType = (type) => {
    switch (type) {
      case 'NodePort':
        return ServiceIPsRow({
          name: t('Node port'),
          desc: t('Accessible outside the cluster'),
          ips: service?.spec?.ports?.map((port) => port.nodePort.toString()),
          note: t('(all nodes): '),
      });
      case 'LoadBalancer':
        return ServiceIPsRow({
          name: t('External load balancer'),
          desc: t('Ingress points of load balancer'),
          ips: service?.status?.loadBalancer?.ingress?.map((i) => i.hostname || i.ip || '-'),
        });
      case 'ExternalName':
        return ServiceIPsRow({
          name: t('External service name'),
          desc: t('Location of the resource that backs the service'),
          ips: [service?.spec?.externalName],
        });
      default:
        return ServiceIPsRow({ 
          name: t('Cluster IP'), 
          desc: t('Accessible within the cluster only'),
          ips: [ service?.spec?.clusterIP, ]
        });
    }
  };

  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-6">{t('Type')}</div>
        <div className="col-xs-6">{t('Location')}</div>
      </div>
      <div className="rows">
        {ServiceType(service.spec.type)}
        {service.spec.externalIPs &&
          ServiceIPsRow({
            name: t('External IP'),
            desc: t('IP Addresses accepting traffic for service'),
            ips: service?.spec?.externalIPs,
          })}
      </div>
    </div>
  );
};

const ServiceIPsRow: FC<{ name:string, desc:string, ips: string[], note?:string }> = ({ name, desc, ips, note = null} ) => {
  const { t } = useNetworkingTranslation();

  return (
    <div className="co-ip-row">
      <div className="row">
        <div className="col-xs-6">
          <p className="ip-name">{name}</p>
          <p className="ip-desc">{desc}</p>
        </div>
        <div className="col-xs-6">
          {note && <MutedText content={note} isSpan />}
          {ips ? ips.join(', '): t('Pending')}
        </div>
      </div>
    </div>
  )
};

export default ServiceAddress;
