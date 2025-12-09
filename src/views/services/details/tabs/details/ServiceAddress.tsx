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
          desc: t('Accessible outside the cluster'),
          ips: service?.spec?.ports?.map((port) => port.nodePort.toString()),
          name: t('Node port'),
          note: t('(all nodes): '),
        });
      case 'LoadBalancer':
        return ServiceIPsRow({
          desc: t('Ingress points of load balancer'),
          ips: service?.status?.loadBalancer?.ingress?.map((i) => i.hostname || i.ip || '-'),
          name: t('External load balancer'),
        });
      case 'ExternalName':
        return ServiceIPsRow({
          desc: t('Location of the resource that backs the service'),
          ips: [service?.spec?.externalName],
          name: t('External service name'),
        });
      default:
        return ServiceIPsRow({
          desc: t('Accessible within the cluster only'),
          ips: service?.spec?.clusterIPs || [service?.spec?.clusterIP],
          name: t('Cluster IP'),
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
            desc: t('IP Addresses accepting traffic for service'),
            ips: service?.spec?.externalIPs,
            name: t('External IP'),
          })}
      </div>
    </div>
  );
};

const ServiceIPsRow: FC<{ desc: string; ips: string[]; name: string; note?: string }> = ({
  desc,
  ips,
  name,
  note = null,
}) => {
  const { t } = useNetworkingTranslation();

  return (
    <div className="co-ip-row">
      <div className="row">
        <div className="col-xs-6">
          <p className="ip-name">{name}</p>
          <p className="ip-desc">{desc}</p>
        </div>
        <div className="col-xs-6">
          {note && <MutedText content={note} isSpan />};{ips ? ips.join(', ') : t('Pending')}
        </div>
      </div>
    </div>
  );
};

export default ServiceAddress;
