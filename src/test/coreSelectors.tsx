import React, { ComponentType, FC, PropsWithChildren } from 'react';

/**
 * `connect` pass-through: connected pages supply props directly in integration tests
 * and do not need a Redux store.
 */
export const connect =
  (mapStateToProps?: (state: unknown) => Record<string, unknown>) =>
  <P extends Record<string, unknown>>(Component: ComponentType<P>): FC<P> => {
    const Connected: FC<P> = (props) => {
      const stateProps = (mapStateToProps?.({}) ?? {}) as Partial<P>;
      return <Component {...stateProps} {...props} />;
    };
    Connected.displayName = `Connect(${Component.displayName ?? Component.name ?? 'Component'})`;
    return Connected;
  };

export const Provider: FC<PropsWithChildren<{ store?: unknown }>> = ({ children }) => (
  <>{children}</>
);

export const useSelector = <T,>(selector: (state: unknown) => T): T => selector({});

export const useDispatch = () => () => undefined;

/** Stand-in for the console Redux selector that feeds impersonation into connected pages. */
export const impersonateStateToProps = (): { impersonate: undefined } => ({
  impersonate: undefined,
});
