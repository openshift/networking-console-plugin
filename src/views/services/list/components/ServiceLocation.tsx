import React, { FC } from 'react';

import HostDetails from '@utils/components/HostData/HostDetails';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { Service } from '@utils/types/k8sTypes';

type ServiceLocationProps = {
  service: Service;
};

const ServiceLocation: FC<ServiceLocationProps> = ({ service }) => {
  const { t } = useNetworkingTranslation();

  switch (service?.spec?.type) {
    case 'NodePort': {
      const clusterIP = service?.spec?.clusterIP ? `${service?.spec?.clusterIP}:` : '';
      return (
        <>
          {service?.spec?.ports?.map((portObj) => {
            return (
              <HostDetails
                key={`${portObj?.name || ''}-${portObj?.port}-${portObj?.nodePort || ''}`}
              >
                {clusterIP}
                {portObj.nodePort}
              </HostDetails>
            );
          })}
        </>
      );
    }

    case 'LoadBalancer': {
      if (!service?.status?.loadBalancer?.ingress?.length) {
        return <div className="co-truncate">{t('Pending')}</div>;
      }
      return (
        <>
          {service.status.loadBalancer.ingress.map((ingress) => {
            return (
              <HostDetails key={`${ingress?.hostname || ''}-${ingress?.ip || ''}`}>
                {ingress?.hostname || ingress?.ip || '-'}
              </HostDetails>
            );
          })}
        </>
      );
    }

    case 'ExternalName': {
      return (
        <>
          {service?.spec?.ports?.map((portObj) => {
            const externalName = service?.spec?.externalName
              ? `${service?.spec?.externalName}:`
              : '';
            return (
              <HostDetails key={`${externalName}-${portObj?.port}`}>
                {externalName}
                {portObj?.port}
              </HostDetails>
            );
          })}
        </>
      );
    }

    default: {
      if (service?.spec?.clusterIP === 'None') {
        return <div className="co-truncate">{t('None')}</div>;
      }
      return (
        <>
          {service?.spec?.ports?.map((portObj) => {
            const clusterIP = service?.spec?.clusterIP ? `${service?.spec?.clusterIP}:` : '';
            return (
              <HostDetails
                key={`${portObj?.name || ''}-${portObj?.port}-${portObj?.nodePort || ''}`}
              >
                {clusterIP}
                {portObj?.port}
              </HostDetails>
            );
          })}
        </>
      );
    }
  }
};

export default ServiceLocation;
