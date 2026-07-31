import React, { FC } from 'react';
import { Link } from 'react-router';

import { NamespaceModel, ServiceModel } from '@kubevirt-ui/kubevirt-api/console';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
} from '@openshift-console/dynamic-plugin-sdk';
import { LabelList } from '@utils/components/DetailsItem/LabelList';
import { Selector } from '@utils/components/Selector/Selector';
import { getLabels, getName, getNamespace } from '@utils/resources/shared';
import { ServiceWithHealth } from '@utils/types';
import ServiceActions from '@views/services/actions/ServiceActions';

import { tableColumnClasses } from '../hooks/useServiceColumn';

import ServiceHealthCell from './ServiceHealthCell';
import ServiceLocation from './ServiceLocation';

type ServiceRowType = RowProps<ServiceWithHealth>;

const ServiceGroupVersionKind = getGroupVersionKindForModel(ServiceModel);
const NamespaceGroupVersionKind = getGroupVersionKindForModel(NamespaceModel);

const ServiceRow: FC<ServiceRowType> = ({ activeColumnIDs, obj }) => {
  const namespace = getNamespace(obj);
  const name = getName(obj);
  const labels = getLabels(obj, {});
  const podSelector = obj.spec?.selector ?? {};

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[0]} id="name">
        <ResourceLink
          groupVersionKind={ServiceGroupVersionKind}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[1]} id="health">
        <ServiceHealthCell obj={obj} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[2]} id="namespace">
        <ResourceLink groupVersionKind={NamespaceGroupVersionKind} name={namespace} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[3]} id="labels">
        <LabelList groupVersionKind={ServiceGroupVersionKind} labels={labels} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={tableColumnClasses[4]}
        id="pod-selector"
      >
        {Object.keys(podSelector).length === 0 ? (
          <Link to={`/search/ns/${namespace}?kind=Pod`}>{`All pods within ${namespace}`}</Link>
        ) : (
          <Selector namespace={namespace} selector={podSelector} />
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} className={tableColumnClasses[5]} id="location">
        <ServiceLocation service={obj} />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="">
        <ServiceActions isKebabToggle obj={obj} />
      </TableData>
    </>
  );
};
export default ServiceRow;
