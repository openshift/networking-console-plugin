import React, { cloneElement, FC } from 'react';

import { ChartLegendTooltipStyles } from '@patternfly/react-charts/dist/esm/victory/components/ChartTheme/ChartStyles';
import {
  getLegendTooltipDataProps,
  getLegendTooltipSize,
  getLegendTooltipVisibleData,
  getLegendTooltipVisibleText,
} from '@patternfly/react-charts/dist/esm/victory/components/ChartUtils/chart-tooltip';
import {
  ChartCursorTooltip,
  ChartLegendTooltipProps,
  ChartTooltip,
  getTheme,
} from '@patternfly/react-charts/victory';
import ChartLegendTooltipContent from '@utils/components/Area/components/ChartLegendTooltipContent';
import { DataPoint } from '@utils/components/Area/utils/types';
import { evaluateProp } from '@utils/components/Area/utils/utils';

const ChartLegendTooltip: FC<
  {
    formatDate: (data: DataPoint<Date>[]) => string;
    getLabel?: (prop: { datum: DataPoint<Date> }) => string;
    mainDataName: string;
    stack?: boolean;
  } & Omit<ChartLegendTooltipProps, 'title'>
> = (props) => {
  const {
    activePoints,
    center = { x: 0, y: 0 },
    datum,
    flyoutHeight,
    flyoutWidth,
    formatDate,
    getLabel,
    height,
    isCursorTooltip = true,
    mainDataName, // eslint-disable-next-line perfectionist/sort-objects
    labelComponent = <ChartLegendTooltipContent mainDataName={mainDataName} />,
    legendData,
    stack,
    text,
    themeColor, // eslint-disable-next-line perfectionist/sort-objects
    width, // eslint-disable-next-line perfectionist/sort-objects
    // destructure last
    theme = getTheme(themeColor), // eslint-disable-line perfectionist/sort-objects
    ...rest
  } = props;
  const title = (d) => {
    if (stack) {
      return formatDate(d);
    }
    const mainDatum = mainDataName ? d.find((uDatum) => uDatum.childName === mainDataName) : d[0];
    return mainDatum ? getLabel({ datum: mainDatum }) : `No ${mainDataName || 'data'} available`;
  };
  const pointerLength = theme?.tooltip ? evaluateProp(theme.tooltip.pointerLength, props) : 10;
  const legendTooltipProps = {
    legendData: getLegendTooltipVisibleData({ activePoints, legendData, text, theme }),
    legendProps: getLegendTooltipDataProps(labelComponent.props.legendComponent),
    text: getLegendTooltipVisibleText({ activePoints, legendData, text }),
    theme,
  };

  // Returns flyout height based on legend size
  const getFlyoutHeight = () => {
    const sizeProps = stack
      ? legendTooltipProps
      : {
          ...legendTooltipProps,
          // For non-stack graphs, remove the text for "mainDataName"
          text: legendTooltipProps.text.filter(
            (t, i) => legendTooltipProps.legendData[i].name !== mainDataName,
          ) as number[] | string[],
        };
    const _flyoutHeight =
      getLegendTooltipSize(sizeProps).height + ChartLegendTooltipStyles.flyout.padding;
    return title ? _flyoutHeight + 4 : _flyoutHeight - 10;
  };

  // Returns flyout width based on legend size
  const getFlyoutWidth = () =>
    getLegendTooltipSize(legendTooltipProps).width +
    ChartLegendTooltipStyles.flyout.padding +
    (stack ? 20 : 0);

  // Returns the tooltip content component
  const getTooltipContentComponent = () =>
    cloneElement(labelComponent, {
      center,
      flyoutHeight: flyoutHeight || getFlyoutHeight(),
      flyoutWidth: flyoutWidth || getFlyoutWidth(),
      height,
      legendData,
      stack,
      title,
      width,
      ...labelComponent.props,
    });

  // Returns the tooltip component
  const getTooltipComponent = () => {
    const _flyoutWidth = getFlyoutWidth();
    const tooltipComponent = isCursorTooltip ? <ChartCursorTooltip /> : <ChartTooltip />;
    return cloneElement(tooltipComponent, {
      activePoints,
      center,
      datum,
      flyoutHeight: flyoutHeight || getFlyoutHeight(),
      flyoutWidth: flyoutWidth || getFlyoutWidth(),
      height,
      labelComponent: getTooltipContentComponent(),
      ...(flyoutWidth === undefined && {
        showPointer:
          width > _flyoutWidth + center.x + pointerLength ||
          center.x > _flyoutWidth + pointerLength,
      }),
      text,
      theme,
      width,
      ...rest,
    });
  };

  return getTooltipComponent();
};

export default ChartLegendTooltip;
