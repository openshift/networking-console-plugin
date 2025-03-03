import React, { FC, useCallback, useMemo } from 'react';
import * as _ from 'lodash';

import { Humanize } from '@openshift-console/dynamic-plugin-sdk';
import { ByteDataTypes } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import {
  Chart,
  ChartArea,
  ChartAreaProps,
  ChartAxis,
  ChartGroup,
  ChartThemeColor,
  ChartVoronoiContainer,
  createContainer,
  getCustomTheme,
} from '@patternfly/react-charts/victory';
import ChartLegendTooltip from '@utils/components/Area/components/ChartLegendTooltip';
import GraphEmpty from '@utils/components/Area/components/GraphEmpty';
import PrometheusGraph from '@utils/components/Area/components/PrometheusGraph';
import PrometheusGraphLink from '@utils/components/Area/components/PrometheusGraphLink';
import useRefWidth from '@utils/components/Area/hooks/useRefWidth';
import { DEFAULT_HEIGHT, DEFAULT_TICK_COUNT } from '@utils/components/Area/utils/constants';
import { DataPoint } from '@utils/components/Area/utils/types';
import { getLegendData, processFrame, timeFormatter } from '@utils/components/Area/utils/utils';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { humanizeNumber } from '../../../../utils/utils/units';
import { areaTheme } from '../utils/themes';

export type AreaChartProps = {
  ariaChartLinkLabel?: string;
  ariaChartTitle?: string;
  byteDataType?: ByteDataTypes; //Use this to process the whole data frame at once
  chartStyle?: object[];
  className?: string;
  data?: DataPoint[][];
  domain?: ChartAreaProps['domain'];
  formatDate?: (date: Date, showSeconds?: boolean) => string;
  height?: number;
  humanize?: Humanize;
  loading?: boolean;
  mainDataName?: string;
  padding?: object;
  query?: string | string[];
  showAllTooltip?: boolean;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  tickCount?: number;
  title?: string;
  xAxis?: boolean;
  yAxis?: boolean;
};

export const CursorVoronoiContainer = createContainer('cursor', 'voronoi');

const AreaChart: FC<AreaChartProps> = ({
  ariaChartLinkLabel,
  ariaChartTitle,
  byteDataType = '',
  chartStyle,
  className,
  data = [],
  formatDate = timeFormatter.format,
  height = DEFAULT_HEIGHT,
  humanize = humanizeNumber,
  loading = true,
  mainDataName,
  padding,
  query,
  showAllTooltip,
  tickCount = DEFAULT_TICK_COUNT,
  title,
  xAxis = true,
  yAxis = true,
  ...rest
}) => {
  const { t } = useNetworkingTranslation();
  const [containerRef, width] = useRefWidth();

  const { processedData, unit } = useMemo(() => {
    const nonEmptyDataSets = data.filter((dataSet) => dataSet?.length);
    if (byteDataType) {
      return processFrame(nonEmptyDataSets, byteDataType);
    }
    return { processedData: nonEmptyDataSets, unit: '' };
  }, [byteDataType, data]);

  // If every data point of every data set is 0, force y-domain to [0,1]
  const allZero = useMemo(
    () => _.every(processedData, (dataSet) => _.every(dataSet, ({ y }) => y === 0)),
    [processedData],
  );

  const xTickFormat = useCallback((tick) => formatDate(tick), [formatDate]);
  const yTickFormat = useCallback(
    (tick) => `${humanize(tick, unit, unit).string}`,
    [humanize, unit],
  );

  const domain = useMemo<AreaChartProps['domain']>(
    () => ({
      ...(allZero && { y: [0, 1] }),
      ...(rest.domain ?? {}),
    }),
    [allZero, rest.domain],
  );

  const getLabel = useCallback(
    (prop: { datum: DataPoint<Date> }, includeDate = true) => {
      const { x, y } = prop.datum;
      const value = humanize(y, unit, unit).string;
      const date = formatDate(x);
      return includeDate ? t('{{value}} at {{date}}', { date, value }) : value;
    },
    [humanize, unit, formatDate, t],
  );

  // Note: Victory incorrectly typed ThemeBaseProps.padding as number instead of PaddingProps
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const theme = getCustomTheme(ChartThemeColor.blue, areaTheme);

  const multiLine = processedData?.length > 1;

  const container = useMemo(() => {
    if (multiLine) {
      const legendData = getLegendData(processedData);

      return (
        <CursorVoronoiContainer
          activateData={false}
          cursorDimension="x"
          labelComponent={
            <ChartLegendTooltip
              formatDate={(d) => formatDate(d[0].x)}
              getLabel={getLabel}
              legendData={legendData}
              mainDataName={mainDataName}
              stack={showAllTooltip}
            />
          }
          labels={(props) => getLabel(props, false)}
          mouseFollowTooltips
          voronoiDimension="x"
        />
      );
    }
    return <ChartVoronoiContainer activateData={false} labels={getLabel} voronoiDimension="x" />;
  }, [formatDate, getLabel, mainDataName, multiLine, processedData, showAllTooltip]);

  return (
    <PrometheusGraph className={className} ref={containerRef} title={title}>
      <PrometheusGraphLink ariaChartLinkLabel={ariaChartLinkLabel} query={query}>
        {processedData?.length ? (
          <Chart
            ariaTitle={ariaChartTitle || title}
            containerComponent={container}
            domain={domain}
            domainPadding={{ y: 20 }}
            height={height}
            padding={padding}
            scale={{ x: 'time', y: 'linear' }}
            theme={theme}
            width={width}
          >
            {xAxis && <ChartAxis tickCount={tickCount} tickFormat={xTickFormat} />}
            {yAxis && <ChartAxis dependentAxis tickCount={tickCount} tickFormat={yTickFormat} />}
            <ChartGroup>
              {processedData.map((datum, index) => (
                <ChartArea
                  data={datum}
                  key={index}
                  name={datum[0]?.description}
                  style={chartStyle && chartStyle[index]}
                />
              ))}
            </ChartGroup>
          </Chart>
        ) : (
          <GraphEmpty height={height} loading={loading} />
        )}
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

export default AreaChart;
