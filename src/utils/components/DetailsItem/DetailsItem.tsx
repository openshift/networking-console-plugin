import React, { FC, MouseEvent, ReactNode, SFC } from 'react';
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
  DescriptionListDescription as DL,
  DescriptionListGroup as DLGroup,
  DescriptionListTermHelpText as DLTermHelpText,
  DescriptionListTermHelpTextButton as DLTermHelpTextButton,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import LinkifyExternal from '@views/routes/details/components/tabs/detailsTab/components/RouteIngressStatusSection/LinkifyExternal';

import { getPropertyDescription } from './swagger';

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
      icon={<PencilAltIcon />}
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
    <DLGroup>
      <DLTermHelpText
        className={labelClassName}
        data-test-selector={`details-item-label__${label}`}
      >
        <Split className="pf-v6-u-w-100">
          <SplitItem isFilled>
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
                <DLTermHelpTextButton data-test={label}>{label}</DLTermHelpTextButton>
              </Popover>
            ) : (
              label
            )}
          </SplitItem>
          {editable && editAsGroup && (
            <SplitItem>
              <EditButton onClick={onEdit} testId={label}>
                {t('Edit')}
              </EditButton>
            </SplitItem>
          )}
        </Split>
      </DLTermHelpText>
      <DL className={valueClassName} data-test-selector={`details-item-value__${label}`}>
        {editable && !editAsGroup ? (
          <EditButton onClick={onEdit} testId={label}>
            {value}
          </EditButton>
        ) : (
          value
        )}
      </DL>
    </DLGroup>
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
