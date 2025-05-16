import React, { FC } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

export type BreadcrumbsList = {
  name: string;
  to?: string;
}[];

type BreadcrumbsProps = {
  breadcrumbs: BreadcrumbsList;
};

const Breadcrumbs: FC<BreadcrumbsProps> = ({ breadcrumbs }) => {
  return (
    <Breadcrumb>
      {breadcrumbs.map(({ name, to }, index) => (
        <BreadcrumbItem key={index}>
          {to ? (
            <Link className="pf-v6-c-breadcrumb__link" to={to}>
              {name}
            </Link>
          ) : (
            <span className="pf-v6-c-breadcrumb__link pf-m-current">{name}</span>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
