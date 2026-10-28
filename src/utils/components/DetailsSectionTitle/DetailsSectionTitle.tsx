import React, { FC } from 'react';

import { Title } from '@patternfly/react-core';

type DetailsSectionTitleProps = {
  className?: string;
  titleText: string;
};

const DetailsSectionTitle: FC<DetailsSectionTitleProps> = ({ className, titleText }) => {
  return (
    <Title className={`pf-v6-u-mb-md${className ? ` ${className}` : ''}`} headingLevel="h2">
      {titleText}
    </Title>
  );
};

export default DetailsSectionTitle;
