import { PrometheusResponse, PrometheusResult } from '@openshift-console/dynamic-plugin-sdk';

export type DataPoint<X = Date | number | string> = {
  description?: string;
  label?: string;
  metric?: { [key: string]: string };
  symbol?: {
    fill?: string;
    type?: string;
  };
  x?: X;
  y?: number;
};

export type XMutator = (x: any) => Date;
export type YMutator = (y: any) => number;

export type GetRangeStats = (
  response: PrometheusResponse,
  description?: ((result: PrometheusResult, index: number) => string) | string,
  symbol?: { fill?: string; type?: string },
  xMutator?: XMutator,
  yMutator?: YMutator,
) => DataPoint<Date>[][];

type NumberValue = { valueOf(): number } | number;

/**
 * D3 scale function shape. Don't want to introduce typing dependency to d3
 */
export interface D3Scale<TRange = any> {
  (numberValue: NumberValue): number;

  base?: () => number;
  copy: () => this;
  domain: {
    (): number[];
    (domain: NumberValue[]): D3Scale<TRange>;
  };
  invert: (value: number) => number;
  range: {
    (): TRange[];
    (range: TRange): D3Scale<TRange>;
  };
  tickFormat: (count?: number) => (d: number) => string;
  ticks: (count?: number) => number[];
}

export type Datum = any;
export type ID = number | string;

/**
 * This is the first parameter of a callback when a callback is used to
 * resolve the value of a property instead of a concrete value.
 *
 * Note that additional properties here like `scale`, `x`, `y`, etc are resolved
 * values of properties from the VictoryXXXProps for each component.
 */
export interface CallbackArgs {
  active?: boolean;
  data?: Datum[];
  datum?: Datum;
  horizontal?: boolean;
  index?: ID;
  scale?: {
    x?: D3Scale;
    y?: D3Scale;
  };
  text?: any;
  tick?: any;
  ticks?: any;
  x?: number;
  y?: number;
}

export type ValueOrAccessor<ValueType, PropsType = CallbackArgs> =
  ((props: PropsType) => ValueType) | ValueType;
