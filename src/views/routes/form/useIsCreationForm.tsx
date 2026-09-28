import { useLocation } from 'react-router';

const useIsCreationForm = (): boolean => {
  const location = useLocation();

  return location?.pathname.includes('~new/form');
};

export default useIsCreationForm;
