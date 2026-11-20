import React, { FC, ReactNode } from 'react';

type UnorderedListProps = {
  children: ReactNode;
  className?: string;
};

const UnorderedList: FC<UnorderedListProps> = ({ children, className }) => (
  <ul className={`pf-v6-c-list pf-m-plain${className ? ` ${className}` : ''}`}>{children}</ul>
);

export default UnorderedList;
