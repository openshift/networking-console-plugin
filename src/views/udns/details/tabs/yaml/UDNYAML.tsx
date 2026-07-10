import React, { FC, Suspense } from 'react';

import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import Loading from '@utils/components/Loading/Loading';
import { ClusterUserDefinedNetworkKind, UserDefinedNetworkKind } from '@utils/resources/udns/types';

type UDNYAMLProps = {
  obj?: ClusterUserDefinedNetworkKind | UserDefinedNetworkKind;
};

const UDNYAML: FC<UDNYAMLProps> = ({ obj: udn }) => {
  return !udn ? (
    <Loading />
  ) : (
    <Suspense fallback={<Loading />}>
      <ResourceYAMLEditor initialResource={udn} />
    </Suspense>
  );
};

export default UDNYAML;
