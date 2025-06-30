import React, { FC } from 'react';

import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import { HelperText, HelperTextItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
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
          ips: [service?.spec?.clusterIP],
          name: t('Cluster IP'),
        });
    }
  };

  return (
    <Table borders={false} variant="compact">
      <Thead>
        <Tr>
          <Th className="pf-v6-u-pl-0">{t('Type')}</Th>
          <Th>{t('Location')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {ServiceType(service.spec.type)}
        {service.spec.externalIPs &&
          ServiceIPsRow({
            desc: t('IP Addresses accepting traffic for service'),
            ips: service?.spec?.externalIPs,
            name: t('External IP'),
          })}
      </Tbody>
    </Table>
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
    <Tr>
      <Td className="pf-v6-u-pl-0">
        <p>{name}</p>
        <HelperText>
          <HelperTextItem>{desc}</HelperTextItem>
        </HelperText>
      </Td>
      <Td>
        {note && <MutedText content={note} isSpan />}
        {ips ? ips.join(', ') : t('Pending')}
      </Td>
    </Tr>
  );
};

export default ServiceAddress;
