import React, { FC } from 'react';

import { PageBreadcrumb, PageGroup, PageSection } from '@patternfly/react-core';

import Breadcrumbs, { BreadcrumbsList } from '../Breadcrumbs/Breadcrumbs';
import PaneHeading from '../PaneHeading/PaneHeading';

type DetailsPageTitleProps = {
  breadcrumbs: BreadcrumbsList;
};

const DetailsPageTitle: FC<DetailsPageTitleProps> = ({ breadcrumbs, children }) => (
  <div>
    <PageGroup>
      <PageBreadcrumb>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false}>
        <PaneHeading>{children}</PaneHeading>
      </PageSection>
    </PageGroup>
  </div>
);

export default DetailsPageTitle;
