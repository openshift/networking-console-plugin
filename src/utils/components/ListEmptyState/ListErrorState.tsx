import React, { FC } from 'react';
import { Trans } from 'react-i18next';

import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';

import restrictedSignImg from './restricted-sign.svg';

import './list-error-state.scss';

type ListErrorStateProps = {
  error: any;
  title: string;
};

const ListErrorState: FC<ListErrorStateProps> = ({ error, title }) => {
  const { t } = useNetworkingTranslation();

  if (error?.response?.status === 403)
    return (
      <>
        {title && <ListPageHeader title={title} />}
        <EmptyState
          className="list-error-state-root"
          headingLevel="h4"
          icon={() => <img src={restrictedSignImg} />}
          titleText={t('Restricted Access')}
        >
          <EmptyStateBody>
            {t("You don't have access to this section due to cluster policy.")}
          </EmptyStateBody>
          {!isEmpty(error?.message) && (
            <EmptyStateFooter>
              <Alert isInline title={t('Error details')} variant={AlertVariant.danger}>
                {error?.message}
              </Alert>
            </EmptyStateFooter>
          )}
        </EmptyState>
      </>
    );

  return (
    <>
      {title && <ListPageHeader title={title} />}
      <EmptyState className="list-error-state-root">
        <EmptyStateBody>
          <span className="error-text-body">{error?.message}</span>
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Trans ns="plugin__networking-console-plugin" t={t}>
              Please{' '}
              <Button isInline onClick={() => location.reload()} variant={ButtonVariant.link}>
                try again
              </Button>
              .
            </Trans>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </>
  );
};

export default ListErrorState;
