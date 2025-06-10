import React, { FC, MouseEvent, ReactNode, SFC } from 'react';
import classnames from 'classnames';
import * as _ from 'lodash-es';

import {
  getGroupVersionKindForResource,
  K8sResourceKind,
  useK8sModel,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ButtonVariant,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

import { getPropertyDescription } from './swagger';
import LinkifyExternal from '@views/routes/details/components/tabs/detailsTab/components/RouteIngressStatusSection/LinkifyExternal';

export const PropertyPath: FC<{
  kind: string;
  path: string | string[];
}> = ({ kind, path }) => {
  const pathArray: string[] = _.toPath(path);
  return (
    <Breadcrumb>
      <BreadcrumbItem>{kind}</BreadcrumbItem>
      {pathArray.map((property, i) => {
        const isLast = i === pathArray.length - 1;
        return (
          <BreadcrumbItem isActive={isLast} key={i}>
            {property}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

const EditButton: SFC<EditButtonProps> = (props) => {
  return (
    <Button
      data-test={
        props.testId ? `${props.testId}-details-item__edit-button` : 'details-item__edit-button'
      }
      icon={<PencilAltIcon className="co-icon-space-l pf-v6-c-button-icon--plain" />}
      iconPosition="end"
      isInline
      onClick={props.onClick}
      variant={ButtonVariant.link}
    >
      {props.children}
    </Button>
  );
};

export const DetailsItem: FC<DetailsItemProps> = ({
  canEdit = true,
  children,
  defaultValue = '-',
  description,
  editAsGroup,
  hideEmpty,
  label,
  labelClassName,
  obj,
  onEdit,
  path,
  valueClassName,
}) => {
  const { t } = useNetworkingTranslation();

  const [model] = useK8sModel(obj ? getGroupVersionKindForResource(obj) : '');

  const hide = hideEmpty && _.isEmpty(_.get(obj, path));
  const popoverContent: string = description ?? getPropertyDescription(model, path);
  const value: ReactNode = children || _.get(obj, path, defaultValue);
  const editable = onEdit && canEdit;
  return hide ? null : (
    <>
      <dt
        className={classnames('details-item__label', labelClassName)}
        data-test-selector={`details-item-label__${label}`}
      >
        <Split>
          <SplitItem className="details-item__label">
            {popoverContent || path ? (
              <Popover
                headerContent={<div>{label}</div>}
                {...(popoverContent && {
                  bodyContent: (
                    <LinkifyExternal>
                      <div className="co-pre-line">{popoverContent}</div>
                    </LinkifyExternal>
                  ),
                })}
                {...(path && {
                  footerContent: <PropertyPath kind={model?.kind} path={path} />,
                })}
                maxWidth="30rem"
              >
                <Button
                  className="details-item__popover-button"
                  data-test={label}
                  variant={ButtonVariant.plain}
                >
                  {label}
                </Button>
              </Popover>
            ) : (
              label
            )}
          </SplitItem>
          {editable && editAsGroup && (
            <>
              <SplitItem isFilled />
              <SplitItem>
                <EditButton onClick={onEdit} testId={label}>
                  {t('Edit')}
                </EditButton>
              </SplitItem>
            </>
          )}
        </Split>
      </dt>
      <dd
        className={classnames('details-item__value', valueClassName, {
          'details-item__value--group': editable && editAsGroup,
        })}
        data-test-selector={`details-item-value__${label}`}
      >
        {editable && !editAsGroup ? (
          <EditButton onClick={onEdit} testId={label}>
            {value}
          </EditButton>
        ) : (
          value
        )}
      </dd>
    </>
  );
};

export type DetailsItemProps = {
  canEdit?: boolean;
  defaultValue?: ReactNode;
  description?: string;
  editAsGroup?: boolean;
  hideEmpty?: boolean;
  label: string;
  labelClassName?: string;
  obj?: K8sResourceKind;
  onEdit?: (e: MouseEvent<HTMLButtonElement>) => void;
  path?: string | string[];
  valueClassName?: string;
};

type EditButtonProps = {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  testId?: string;
};

DetailsItem.displayName = 'DetailsItem';
PropertyPath.displayName = 'PropertyPath';
EditButton.displayName = 'EditButton';
