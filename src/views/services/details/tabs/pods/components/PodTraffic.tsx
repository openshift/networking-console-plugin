import React, { FC } from 'react';

import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { Tooltip } from '@patternfly/react-core';
import { ConnectedIcon, DisconnectedIcon } from '@patternfly/react-icons';
import Loading from '@utils/components/Loading/Loading';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { EndPointSliceModel } from '@utils/models';
import { EndpointSliceKind } from '@utils/types';

export type PodTrafficProp = {
  namespace: string;
  podName: string;
  tooltipFlag?: boolean;
};

export const PodTraffic: FC<PodTrafficProp> = ({ namespace, podName, tooltipFlag }) => {
  const { t } = useNetworkingTranslation();
  const [data, loaded, loadError] = useK8sWatchResource<EndpointSliceKind[]>({
    groupVersionKind: {
      kind: EndPointSliceModel.kind,
      version: EndPointSliceModel.apiVersion,
    },
    isList: true,
    namespace,
    namespaced: true,
  });

  if (!loaded) {
    return <Loading />;
  } else if (loaded && loadError) {
    return <Status status="Error" title={t('Error')} />;
  }
  const allEndpoints = data?.reduce((prev, next) => prev.concat(next?.endpoints), []);
  const receivingTraffic = allEndpoints?.some((endPoint) => endPoint?.targetRef?.name === podName);
  if (tooltipFlag) {
    return (
      loaded &&
      !loadError && (
        <div data-test="pod-traffic-status">
          <Tooltip
            content={receivingTraffic ? t('Receiving Traffic') : t('Not Receiving Traffic')}
            position="top"
          >
            {receivingTraffic ? <ConnectedIcon /> : <DisconnectedIcon />}
          </Tooltip>
        </div>
      )
    );
  }
  return loaded && !loadError && (receivingTraffic ? <ConnectedIcon /> : <DisconnectedIcon />);
};
