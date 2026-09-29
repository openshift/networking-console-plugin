import React, { FC } from 'react';
import { Link } from 'react-router';
import * as _ from 'lodash';

import { useActiveNamespace, useActivePerspective } from '@openshift-console/dynamic-plugin-sdk';
import { useIsAdmin } from '@utils/hooks/useIsAdmin';

type PrometheusGraphLinkProps = {
  ariaChartLinkLabel?: string;
  query: string | string[];
};

const PrometheusGraphLink: FC<PrometheusGraphLinkProps> = ({
  ariaChartLinkLabel,
  children,
  query,
}) => {
  const [perspective] = useActivePerspective();
  const isAdmin = useIsAdmin();
  const namespace = useActiveNamespace();
  const queries = _.compact(_.castArray(query));

  if (!queries.length) {
    return <>{children}</>;
  }

  const canAccessMonitoring = !!window.SERVER_FLAGS.prometheusBaseURL && isAdmin;

  const params = new URLSearchParams();
  queries.forEach((q, index) => params.set(`query${index}`, q));

  const url =
    canAccessMonitoring && perspective === 'admin'
      ? `/monitoring/query-browser?${params.toString()}`
      : `/dev-monitoring/ns/${namespace}/metrics?${params.toString()}`;

  return (
    <Link
      aria-label={ariaChartLinkLabel}
      style={{ color: 'inherit', textDecoration: 'none' }}
      to={url}
    >
      {children}
    </Link>
  );
};

export default PrometheusGraphLink;
