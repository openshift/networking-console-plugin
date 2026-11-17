import React, { FC, useMemo } from 'react';

import {
  getGroupVersionKindForResource,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { Card, CardBody, CardTitle, Label, Stack, StackItem, Title } from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { getName, getNamespace } from '@utils/resources/shared';
import { useTopologyContext } from '@views/topology/context/TopologyContext';
import { generateDataModel } from '@views/topology/utils/dataTransformation/dataTransformation';
import { getResourceID } from '@views/topology/utils/dataTransformation/resourceUtils';

type PathResource = {
  id: string;
  resource: NonNullable<ReturnType<typeof useTopologyContext>['selectedNode']>['resource'];
};

const NetworkPathTab: FC = () => {
  const { t } = useNetworkingTranslation();
  const { resources, selectedNode } = useTopologyContext();

  const pathResources = useMemo<PathResource[]>(() => {
    if (!resources || !selectedNode) return [];

    const model = generateDataModel(resources);
    const resourceID = getResourceID(selectedNode.resource);
    const connectedIDs = model.edges
      .filter((edge) => edge.source === resourceID || edge.target === resourceID)
      .map((edge) => (edge.source === resourceID ? edge.target : edge.source));
    const connectedResources = model.nodes
      .filter((node) => connectedIDs.includes(node.id))
      .map((node) => ({ id: node.id, resource: node.data.resource }));

    return [{ id: resourceID, resource: selectedNode.resource }, ...connectedResources];
  }, [resources, selectedNode]);

  if (!selectedNode) return null;

  const connectedResourceNames = pathResources.slice(1).map(({ resource }) => getName(resource));

  return (
    <Stack className="pf-v6-u-mt-md" hasGutter>
      <StackItem>
        <p className="pf-v6-u-my-0">
          {t('Resources directly connected to {{resource}}.', {
            resource: getName(selectedNode.resource),
          })}
        </p>
      </StackItem>
      <StackItem>
        <Card isCompact variant="secondary">
          <CardTitle component="h3">{t('Connected resources')}</CardTitle>
          <CardBody>{connectedResourceNames.join(', ') || '-'}</CardBody>
        </Card>
      </StackItem>
      <StackItem>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              {t('Connected components')}
            </Title>
          </StackItem>
          {pathResources.map(({ id, resource }, index) => (
            <StackItem key={id}>
              <Card isCompact>
                <CardBody>
                  <Stack>
                    <StackItem>
                      <Label color={index === 0 ? 'blue' : 'grey'} isCompact>
                        {index === 0 ? t('Selected') : t('Connected')}
                      </Label>
                    </StackItem>
                    <StackItem>{resource.kind}</StackItem>
                    <StackItem>
                      <ResourceLink
                        groupVersionKind={getGroupVersionKindForResource(resource)}
                        name={getName(resource)}
                        namespace={getNamespace(resource)}
                      />
                    </StackItem>
                  </Stack>
                </CardBody>
              </Card>
            </StackItem>
          ))}
        </Stack>
      </StackItem>
    </Stack>
  );
};

export default NetworkPathTab;
