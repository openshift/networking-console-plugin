import { Ref, useCallback, useEffect, useRef, useState } from 'react';

type UseRefWidth = () => [Ref<HTMLDivElement>, number];

const useRefWidth: UseRefWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  const setRef = useCallback((e: HTMLDivElement) => {
    const newWidth = e?.clientWidth;
    newWidth && ref.current?.clientWidth !== newWidth && setWidth(e.clientWidth);
    ref.current = e;
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(ref.current?.clientWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar_toggle', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar_toggle', handleResize);
    };
  }, []);

  const clientWidth = ref?.current?.clientWidth;

  useEffect(() => {
    width !== clientWidth && setWidth(clientWidth);
  }, [clientWidth, width]);

  return [setRef, width] as [Ref<HTMLDivElement>, number];
};

export default useRefWidth;
