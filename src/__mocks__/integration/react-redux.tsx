import React, { ComponentType, FC, PropsWithChildren } from 'react';

/**
 * `connect` pass-through: ProjectNetworkSettingsTab is wrapped with `connect(impersonateStateToProps)`
 * for console Redux. Integration tests supply props directly and do not need a store.
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
