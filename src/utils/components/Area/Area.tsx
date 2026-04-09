import React, { FC } from 'react';

import { PrometheusEndpoint, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk';
import { ByteDataTypes } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import AreaChart, { AreaChartProps } from '@utils/components/Area/components/AreaChart';
import {
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from '@utils/components/Area/utils/constants';
import { mapLimitsRequests } from '@utils/components/Area/utils/utils';

type AreaProps = {
  byteDataType?: ByteDataTypes;
  endTime?: number;
  limitQuery?: string;
  namespace?: string;
  query: string;
  requestedQuery?: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
} & AreaChartProps;

const Area: FC<AreaProps> = ({
  endTime = Date.now(),
  limitQuery,
  namespace,
  query,
  requestedQuery,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
  ...rest
}) => {
  const prometheusPollProps = {
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    endTime,
    namespace,
    samples,
    timeout,
    timespan,
  };

  const [utilization, utilizationLoading] = usePrometheusPoll({
    query,
    ...prometheusPollProps,
  });
  const [limit, limitLoading] = usePrometheusPoll({
    query: limitQuery,
    ...prometheusPollProps,
  });
  const [requested, requestedLoading] = usePrometheusPoll({
    query: requestedQuery,
    ...prometheusPollProps,
  });

  const loading: boolean = utilizationLoading && limitLoading && requestedLoading;
  const { chartStyle, data } = mapLimitsRequests(utilization, limit, requested);

  return (
    <AreaChart
      chartStyle={chartStyle}
      data={data}
      loading={loading}
      mainDataName="usage"
      query={[query, limitQuery, requestedQuery]}
      {...rest}
    />
  );
};

export default Area;
