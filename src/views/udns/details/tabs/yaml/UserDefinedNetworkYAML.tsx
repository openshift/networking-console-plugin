import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

type UserDefinedNetworkYAMLProps = {
  obj?: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
};

const UserDefinedNetworkYAML: FC<UserDefinedNetworkYAMLProps> = ({ obj: udn }) => {
  return !udn ? (
    <Loading />
  ) : (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={udn} />
    </Suspense>
  );
};

export default UserDefinedNetworkYAML;
