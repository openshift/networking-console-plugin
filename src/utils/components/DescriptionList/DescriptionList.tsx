import React, { FC, ReactNode } from 'react';

type DescriptionListProps = {
  children: ReactNode;
  className?: string;
};

const DescriptionList: FC<DescriptionListProps> = ({ children, className }) => (
  <dl className={`pf-v6-c-description-list${className ? ` ${className}` : ''}`}>{children}</dl>
);

export default DescriptionList;
