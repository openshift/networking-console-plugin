import React, { FC } from 'react';
import { LinkifyIt } from 'linkify-it';
import tlds from 'tlds';

const linkify = new LinkifyIt();
linkify.tlds(tlds).set({ fuzzyLink: true });

type LinkifyExternalProps = {
  text: string;
};

const LinkifyExternal: FC<LinkifyExternalProps> = ({ text }) => {
  const matches = linkify.match(text);

  if (!matches) {
    return <>{text}</>;
  }

  const elements = [];
  let lastIndex = 0;
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    elements.push(
      <a href={match.url} rel="noopener noreferrer" target="_blank">
        {match.text}
      </a>,
    );

    lastIndex = match.lastIndex;
  }

  if (text.length > lastIndex) {
    elements.push(text.substring(lastIndex));
  }

  return <>{elements.length === 1 ? elements[0] : elements}</>;
};

export default LinkifyExternal;
