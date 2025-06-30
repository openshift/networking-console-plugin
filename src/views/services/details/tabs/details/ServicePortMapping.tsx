import React from 'react';

import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

const ServicePortMapping = ({ ports }) => {
  const { t } = useNetworkingTranslation();
  return (
    <Table borders={false} variant="compact">
      <Thead>
        <Tr>
          <Th className="pf-v6-u-pl-0">{t('Name')}</Th>
          <Th>{t('Port')}</Th>
          <Th>{t('Protocol')}</Th>
          <Th>{t('Pod port or name')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {ports.map((portObj, i) => {
          return (
            <Tr key={i}>
              <Td className="pf-v6-u-pl-0">
                <div className="co-text-service">
                  <p>{portObj.name || '-'}</p>
                  {portObj.nodePort && <p className="co-text-node">{t('Node port')}</p>}
                </div>
              </Td>
              <Td>
                <p className="co-text-service">
                  <ResourceIcon kind="Service" />
                  <span>{portObj.port}</span>
                </p>
                {portObj.nodePort && (
                  <p className="co-text-node">
                    <ResourceIcon kind="Node" />
                    <span>{portObj.nodePort}</span>
                  </p>
                )}
              </Td>
              <Td>
                <p>{portObj.protocol}</p>
              </Td>
              <Td>
                <p className="co-text-pod">
                  <ResourceIcon kind="Pod" />
                  <span>{portObj.targetPort}</span>
                </p>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default ServicePortMapping;
