import React, { FC } from 'react';

import { Title } from '@patternfly/react-core';

type DetailsSectionTitleProps = {
  titleText: string;
};

const DetailsSectionTitle: FC<DetailsSectionTitleProps> = ({ titleText }) => {
  return (
    <Title className="pf-v6-u-mb-md" headingLevel="h2">
      {titleText}
    </Title>
  );
};

export default DetailsSectionTitle;
