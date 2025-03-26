import React, { FC, useState } from 'react';

import { Button, ButtonVariant } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { CopyToClipboard } from '@utils/components/CopyToClipboard/CopyToClipboard';
import { DetailsItem } from '@utils/components/DetailsItem/DetailsItem';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteKind } from '@utils/types';
import MaskedData from '@views/routes/details/components/tabs/detailsTab/components/TLSSettingsSection/MaskedData';

type TLSSettingsProps = {
  route: RouteKind;
};

const TLSSettings: FC<TLSSettingsProps> = ({ route }) => {
  const { t } = useNetworkingTranslation();
  const [showKey, setShowKey] = useState(false);
  const { tls } = route.spec;

  if (!tls) {
    return <>{t('TLS is not enabled')}.</>;
  }

  const visibleKeyValue = showKey ? tls.key : <MaskedData />;

  return (
    <dl>
      <DetailsItem label={t('Termination type')} obj={route} path="spec.tls.termination" />
      <DetailsItem
        label={t('Insecure traffic')}
        obj={route}
        path="spec.tls.insecureEdgeTerminationPolicy"
      />
      <DetailsItem label={t('Certificate')} obj={route} path="spec.tls.certificate">
        {tls?.certificate ? <CopyToClipboard value={tls.certificate} /> : '-'}
      </DetailsItem>
      <dt className="co-m-route-tls-reveal__title">
        {t('Key')}{' '}
        {tls?.key && (
          <Button
            className="pf-m-link--align-left"
            onClick={() => setShowKey(!showKey)}
            variant={ButtonVariant.link}
          >
            {showKey ? (
              <>
                <EyeSlashIcon className="co-icon-space-r" />
                {t('Hide')}
              </>
            ) : (
              <>
                <EyeIcon className="co-icon-space-r" />
                {t('Reveal')}
              </>
            )}
          </Button>
        )}
      </dt>
      <dd>
        {tls?.key ? <CopyToClipboard value={tls?.key} visibleValue={visibleKeyValue} /> : '-'}
      </dd>
      <DetailsItem label={t('CA certificate')} obj={route} path="spec.tls.caCertificate">
        {tls.certificate ? <CopyToClipboard value={tls.caCertificate} /> : '-'}
      </DetailsItem>
      {tls?.termination === 'reencrypt' && (
        <DetailsItem
          label={t('Destination CA certificate')}
          obj={route}
          path="spec.tls.destinationCACertificate"
        >
          {tls?.destinationCACertificate ? (
            <CopyToClipboard value={tls.destinationCACertificate} />
          ) : (
            '-'
          )}
        </DetailsItem>
      )}
    </dl>
  );
};

export default TLSSettings;
