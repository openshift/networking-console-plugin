import React, { FC } from 'react';
import { Link } from 'react-router';
import * as _ from 'lodash';

import { ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import { IoK8sApiCoreV1Service } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { Selector } from '@utils/components/Selector/Selector';
import { getName, getNamespace } from '@utils/resources/shared';
import ServiceActions from '@views/services/actions/ServiceActions';

import { tableColumnClasses } from '../hooks/useServiceColumn';

import ServiceLocation from './ServiceLocation';

type ServiceRowType = RowProps<IoK8sApiCoreV1Service>;

const ServiceGroupVersionKind = getGroupVersionKindForModel(ServiceModel);

const ServiceRow: FC<ServiceRowType> = ({ activeColumnIDs, obj }) => {
  const namespace = getNamespace(obj);
  const name = getName(obj);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[0]} id="name">
        <ResourceLink
          groupVersionKind={ServiceGroupVersionKind}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[1]} id="namespace">
        <ResourceLink kind="Namespace" name={namespace} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[2]} id="labels">
        <LabelList groupVersionKind={ServiceGroupVersionKind} labels={obj.metadata.labels} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={tableColumnClasses[3]}
        id="pod-selector"
      >
        {_.isEmpty(obj.spec.selector) ? (
          <Link
            to={`/search/ns/${obj.metadata.namespace}?kind=Pod`}
          >{`All pods within ${obj.metadata.namespace}`}</Link>
        ) : (
          <Selector namespace={obj.metadata.namespace} selector={obj.spec.selector} />
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[4]} id="labels">
        <ServiceLocation service={obj} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="">
        <ServiceActions isKebabToggle obj={obj} />
      </TableData>
    </>
  );
};
export default ServiceRow;
