import React, { FC } from 'react';
import { Trans } from 'react-i18next';

import { Button, ButtonVariant, Popover } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';

type CustomRouteHelpProps = {
  host: string;
  routerCanonicalHostname: string;
};

const CustomRouteHelp: FC<CustomRouteHelpProps> = ({ host, routerCanonicalHostname }) => {
  const { t } = useNetworkingTranslation();

  return (
    <Popover
      bodyContent={
        <div>
          <p>
            <Trans ns="plugin__networking-console-plugin" t={t}>
              To use a custom route, you must update your DNS provider by creating a canonical name
              (CNAME) record. Your CNAME record should point to your custom domain{' '}
              <strong>{{ host }}</strong>, to the OpenShift canonical router hostname,{' '}
              <strong>{{ routerCanonicalHostname }}</strong>, as the alias.
            </Trans>
          </p>
        </div>
      }
      headerContent={<>{t('Custom route')}</>}
    >
      <Button
        className="pf-m-link--align-left"
        icon={<QuestionCircleIcon />}
        variant={ButtonVariant.link}
      >
        {t('Do you need to set up custom DNS?')}
      </Button>
    </Popover>
  );
};

export default CustomRouteHelp;
