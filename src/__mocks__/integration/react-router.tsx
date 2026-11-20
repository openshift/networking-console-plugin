import React, { createContext, FC, PropsWithChildren, useContext, useMemo, useState } from 'react';

/**
 * Stateful `react-router` double: `useNavigate` updates an in-memory location, so
 * components that drive drawers from query parameters re-render the way they do in the
 * console. Only the pieces the plugin imports are implemented.
 */
type Location = { hash: string; pathname: string; search: string };

const RouterContext = createContext<{ location: Location; navigate: (to: string) => void } | null>(
  null,
);

const parse = (to: string): Location => {
  const [pathAndSearch = '/', hash = ''] = to.split('#');
  const [pathname = '/', search = ''] = pathAndSearch.split('?');
  return { hash: hash ? `#${hash}` : '', pathname, search: search ? `?${search}` : '' };
};

export const RouterProvider: FC<PropsWithChildren> = ({ children }) => {
  const [location, setLocation] = useState<Location>({ hash: '', pathname: '/', search: '' });
  const value = useMemo(
    () => ({ location, navigate: (to: string) => setLocation(parse(to)) }),
    [location],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useLocation = (): Location => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useLocation requires RouterProvider');
  return context.location;
};

export const useNavigate = (): ((to: string) => void) => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useNavigate requires RouterProvider');
  return context.navigate;
};

/** Renders the current location so tests can assert the page a click navigated to. */
export const LocationProbe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{`${pathname}${search}`}</div>;
};

export const Link = ({ children, to }: PropsWithChildren<{ to: string }>) => (
  <a href={to}>{children}</a>
);

export const useParams = <T extends Record<string, string>>(): T => ({}) as T;
