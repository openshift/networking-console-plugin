import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

export type BreadcrumbsList = {
  name: string;
  to?: string;
  dataTestId?: string;
}[];

type BreadcrumbsProps = {
  breadcrumbs: BreadcrumbsList;
};

const Breadcrumbs: FC<BreadcrumbsProps> = ({ breadcrumbs }) => {  
  return (
    <Breadcrumb>
      {breadcrumbs.map(({ name, to, dataTestId }, index) => (
        <BreadcrumbItem key={index}>
          {to ? (
            <Link className="pf-v6-c-breadcrumb__link" to={to} data-test-id={dataTestId}>
              {name}
            </Link>
          ) : (
            <span className="pf-v6-c-breadcrumb__link pf-m-current" data-test-id={dataTestId}>{name}</span>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
