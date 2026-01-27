import React, { cloneElement, FC } from 'react';

import { ChartLegendTooltipStyles } from '@patternfly/react-charts/dist/esm/victory/components/ChartTheme/ChartStyles';
import {
  getLegendTooltipDataProps,
  getLegendTooltipSize,
  getLegendTooltipVisibleData,
  getLegendTooltipVisibleText,
} from '@patternfly/react-charts/dist/esm/victory/components/ChartUtils/chart-tooltip';
import {
  ChartLabel,
  ChartLegend,
  ChartLegendTooltipContentProps,
  ChartLegendTooltipLabel,
  getTheme,
} from '@patternfly/react-charts/victory';

import { evaluateProp } from '../utils/utils';

const ChartLegendTooltipContent: FC<
  {
    mainDataName?: string;
    stack?: boolean;
  } & ChartLegendTooltipContentProps
> = (props) => {
  const {
    activePoints,
    center,
    dx = 0,
    dy = 0,
    flyoutHeight,
    flyoutWidth,
    height,
    labelComponent = <ChartLegendTooltipLabel />,
    legendComponent = <ChartLegend />,
    legendData,
    mainDataName,
    stack,
    text,
    themeColor,
    title,
    titleComponent = <ChartLabel />,
    width,
    // destructure last
    // eslint-disable-next-line perfectionist/sort-objects
    theme = getTheme(themeColor),
    ...rest
  } = props;
  const pointerLength = theme?.tooltip ? evaluateProp(theme.tooltip.pointerLength, props) : 10;
  const legendProps = getLegendTooltipDataProps(legendComponent.props);
  const visibleLegendData = getLegendTooltipVisibleData({
    activePoints,
    colorScale: legendProps.colorScale,
    legendData,
    text,
    theme,
  });

  const hasMainData = mainDataName ? activePoints[0].childName === mainDataName : false;

  if (stack) {
    visibleLegendData.reverse();
  } else if (hasMainData) {
    visibleLegendData.shift();
  }

  // Component offsets
  const legendOffsetX = 0;
  const legendOffsetY = title ? 9 : -10;
  const titleOffsetX = 10;
  const titleOffsetY = 0;

  // Returns x position of flyout
  const getX = () => {
    if (!(center || flyoutWidth || width)) {
      const x = (rest as any).x;
      return x ? x : undefined;
    }
    const _flyoutWidth = evaluateProp(flyoutWidth, props);
    if (width > center.x + _flyoutWidth + pointerLength) {
      return center.x + ChartLegendTooltipStyles.flyout.padding / 2;
    } else if (center.x < _flyoutWidth + pointerLength) {
      return ChartLegendTooltipStyles.flyout.padding / 2 - pointerLength;
    }
    return center.x - _flyoutWidth;
  };

  // Returns y position
  const getY = () => {
    if (!(center || flyoutHeight || height)) {
      const y = (rest as any).y;
      return y ? y : undefined;
    }
    const _flyoutHeight = evaluateProp(flyoutHeight, props);
    if (center.y < _flyoutHeight / 2) {
      return ChartLegendTooltipStyles.flyout.padding / 2;
    } else if (center.y > height - _flyoutHeight / 2) {
      return height - _flyoutHeight + ChartLegendTooltipStyles.flyout.padding / 2;
    }
    return center.y - _flyoutHeight / 2 + ChartLegendTooltipStyles.flyout.padding / 2;
  };

  // Min & max dimensions do not include flyout padding
  const maxLegendDimensions = getLegendTooltipSize({
    legendData: visibleLegendData,
    legendProps,
    text: getLegendTooltipVisibleText({ activePoints, legendData, text }),
    theme,
  });
  const minLegendDimensions = getLegendTooltipSize({
    legendData: [{ name: '' }],
    legendProps,
    theme,
  });

  // Returns the label component
  const getLabelComponent = () =>
    cloneElement(labelComponent, {
      dx: maxLegendDimensions.width - minLegendDimensions.width,
      legendData: visibleLegendData,
      ...labelComponent.props,
    });

  // Returns the title component
  const getTitleComponent = () => {
    const _title = title instanceof Function ? title(activePoints) : title;

    return cloneElement(titleComponent, {
      style: {
        fill: ChartLegendTooltipStyles.label.fill,
      },
      text: _title,
      textAnchor: 'start',
      x: getX() + titleOffsetX + evaluateProp(dx, props),
      y: getY() + titleOffsetY + evaluateProp(dy, props),
      ...titleComponent.props,
    });
  };

  const tooltipLegendData = getLegendTooltipVisibleData({
    activePoints,
    colorScale: legendProps.colorScale,
    legendData,
    text,
    textAsLegendData: true,
    theme,
  });

  if (stack) {
    tooltipLegendData.reverse();
  } else if (hasMainData) {
    tooltipLegendData.shift();
  }

  // Returns the legend component
  const getLegendComponent = () =>
    cloneElement(legendComponent, {
      data: tooltipLegendData,
      labelComponent: getLabelComponent(),
      standalone: false,
      theme,
      x: getX() + legendOffsetX + evaluateProp(dx, props),
      y: getY() + legendOffsetY + evaluateProp(dy, props),
      ...legendProps,
    });

  return (
    <>
      {getTitleComponent()}
      {getLegendComponent()}
    </>
  );
};

export default ChartLegendTooltipContent;
