import React, { FC } from 'react';

import { IoK8sApiNetworkingV1IngressSpec } from '@kubevirt-ui-ext/kubevirt-api/kubernetes';
import { Tbody } from '@patternfly/react-table';
import EmptyBox from '@utils/components/EmptyBox/EmptyBox';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import { isEmpty } from '@utils/utils';
import RulesRow from '@views/ingresses/details/tabs/details/components/IngressRulesSection/RulesRow';
import { IngressPathRule } from '@views/ingresses/details/tabs/details/utils/types';
import { getPort } from '@views/ingresses/details/tabs/details/utils/utils';

type RulesRowsProps = {
  namespace: string;
  spec: IoK8sApiNetworkingV1IngressSpec;
};

const RulesRows: FC<RulesRowsProps> = ({ namespace, spec }) => {
  const { t } = useNetworkingTranslation();

  if (!spec?.rules) {
    return <EmptyBox label={t('Rules')} />;
  }

  const rules: IngressPathRule[] = spec?.rules?.reduce((acc, rule) => {
    const paths = rule?.http?.paths;

    if (isEmpty(paths)) {
      acc.push([
        {
          host: rule.host || '*',
          path: '*',
          serviceName: spec?.defaultBackend?.service?.name,
          servicePort: getPort(spec?.defaultBackend?.service),
        },
      ]);
      return acc;
    }

    paths?.forEach((path) => {
      acc.push({
        host: rule.host || '*',
        path: path.path || '*',
        pathType: path.pathType,
        serviceName: path?.backend?.service?.name,
        servicePort: getPort(path?.backend?.service),
      });
    });

    return acc;
  }, []);

  return (
    <Tbody>
      {rules.map((rule) => {
        return <RulesRow key={rule.serviceName} namespace={namespace} rule={rule} />;
      })}
    </Tbody>
  );
};

export default RulesRows;
