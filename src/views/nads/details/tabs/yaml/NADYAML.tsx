import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { NetworkAttachmentDefinitionKind } from '@utils/resources/nads/types';

type NADYAMLProps = {
  obj?: NetworkAttachmentDefinitionKind;
};

const NADYAML: FC<NADYAMLProps> = ({ obj: nad }) => {
  return !nad ? (
    <Loading />
  ) : (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={nad} />
    </Suspense>
  );
};

export default NADYAML;
