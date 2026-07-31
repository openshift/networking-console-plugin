import React, { FC } from 'react';
import classNames from 'classnames';

import { NamespaceModel, RouteModel, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { getName, getNamespace } from '@utils/resources/shared';
import { RouteWithHealth } from '@utils/types';
import RouteActions from '@views/routes/actions/RouteActions';
import RouteLocation from '@views/routes/list/components/RouteLocation';
import RouteStatus from '@views/routes/list/components/RouteStatus';
import { tableColumnClasses } from '@views/routes/list/hooks/useRouteColumns';

import RouteBackendHealthCell from './RouteBackendHealthCell';

type RouteRowProps = RowProps<RouteWithHealth>;

const RouteRow: FC<RouteRowProps> = ({ activeColumnIDs, obj: route }) => {
  const namespace = getNamespace(route);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[0]} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(RouteModel)}
          name={getName(route)}
          namespace={getNamespace(route)}
        />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={tableColumnClasses[1]}
        id="backend-health"
      >
        <RouteBackendHealthCell obj={route} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={classNames(tableColumnClasses[2], 'co-break-word')}
        id="namespace"
      >
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
          name={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[3]} id="status">
        <RouteStatus route={route} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={classNames(tableColumnClasses[4], 'co-break-word')}
        id="location"
      >
        <RouteLocation route={route} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[5]} id="service">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
          name={route.spec.to.name}
          namespace={namespace}
          title={route.spec.to.name}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[6]} id="">
        <RouteActions isKebabToggle route={route} />
      </TableData>
    </>
  );
};

export default RouteRow;
