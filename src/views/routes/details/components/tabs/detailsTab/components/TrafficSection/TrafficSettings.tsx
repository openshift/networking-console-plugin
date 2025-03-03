import React, { FC } from 'react';

import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { RouteKind } from '@utils/types';
import RouteTargetRow from '@views/routes/details/components/tabs/detailsTab/components/TrafficSection/RouteTargetRow';

type TrafficSettingsProps = {
  route: RouteKind;
};

const TrafficSettings: FC<TrafficSettingsProps> = ({ route }) => {
  const { t } = useNetworkingTranslation();

  return (
    <>
      <p className="co-m-pane__explanation">
        {t('This route splits traffic across multiple services.')}
      </p>
      <div className="co-table-container">
        <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
          <thead className="pf-v6-c-table__thead">
            <tr className="pf-v6-c-table__tr">
              <th className="pf-v6-c-table__th">{t('Service')}</th>
              <th className="pf-v6-c-table__th">{t('Weight')}</th>
              <th className="pf-v6-c-table__th">{t('Percent')}</th>
            </tr>
          </thead>
          <tbody className="pf-v6-c-table__tbody">
            <RouteTargetRow route={route} target={route.spec.to} />
            {route.spec.alternateBackends.map((alternate, i) => (
              <RouteTargetRow key={i} route={route} target={alternate} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TrafficSettings;
