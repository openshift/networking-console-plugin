import { useIsAdmin } from '@utils/hooks/useIsAdmin';
import { useNetworkingTranslation } from '@utils/hooks/useNetworkingTranslation';
import RouteDetailsTab from '@views/routes/details/components/tabs/detailsTab/RouteDetailsTab';
import RouteMetricsTab from '@views/routes/details/components/tabs/metricsTab/RouteMetricsTab';
import RouteYAMLTab from '@views/routes/details/components/tabs/yamlTab/RouteYAMLTab';

const useRouteTabs = () => {
  const { t } = useNetworkingTranslation();
  const isAdmin = useIsAdmin();

  return [
    {
      component: RouteDetailsTab,
      href: '',
      name: t('Details'),
    },
    ...(isAdmin
      ? [
          {
            component: RouteMetricsTab,
            href: 'metrics',
            name: t('Metrics'),
          },
        ]
      : []),
    {
      component: RouteYAMLTab,
      href: 'yaml',
      name: t('YAML'),
    },
  ];
};

export default useRouteTabs;
