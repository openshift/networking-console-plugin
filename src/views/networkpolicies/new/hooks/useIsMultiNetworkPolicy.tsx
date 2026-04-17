import { useLocation } from 'react-router';

import { MultiNetworkPolicyModel } from '@utils/models';
import { isEmpty } from '@utils/utils';

const useIsMultiNetworkPolicy = () => {
  const location = useLocation();

  return !isEmpty(location.pathname.match(MultiNetworkPolicyModel.kind));
};

export default useIsMultiNetworkPolicy;
