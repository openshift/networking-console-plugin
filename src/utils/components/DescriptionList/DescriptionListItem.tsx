import React, { FC, ReactNode } from 'react';

type DescriptionListItemProps = {
  description: ReactNode;
  term: ReactNode;
};

const DescriptionListItem: FC<DescriptionListItemProps> = ({ description, term }) => (
  <div className="pf-v6-c-description-list__group">
    <dt className="pf-v6-c-description-list__term">{term}</dt>
    <dd className="pf-v6-c-description-list__description">{description}</dd>
  </div>
);

export default DescriptionListItem;
