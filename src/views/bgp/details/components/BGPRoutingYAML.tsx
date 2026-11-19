import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { BGPRouting } from '@utils/resources/bgp/types';

const BGPRoutingYAML: FC<{ obj?: BGPRouting }> = ({ obj }) => {
  if (!obj) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={obj} />
    </Suspense>
  );
};

export default BGPRoutingYAML;
