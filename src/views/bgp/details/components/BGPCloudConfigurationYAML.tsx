import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { BGPCloudConfiguration } from '@utils/resources/bgp/types';

const BGPCloudConfigurationYAML: FC<{ obj?: BGPCloudConfiguration }> = ({ obj }) => {
  if (!obj) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={obj} />
    </Suspense>
  );
};

export default BGPCloudConfigurationYAML;
