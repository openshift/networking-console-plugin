import { ConsumersAvailability, SourceAvailability, SourceState } from './types';

const getNumberField = (value: unknown, key: string): number | undefined => {
  if (!value || typeof value !== 'object' || !(key in value)) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === 'number' ? field : undefined;
};

export const getErrorCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  const code = getNumberField(error, 'code');
  if (code !== undefined) return code;

  return getNumberField((error as Record<string, unknown>).response, 'status');
};

// The SDK reports an uninstalled CRD as `NoModelError` ('Model does not exist'); that is absence, not failure.
const isMissingModelError = (error: unknown): boolean =>
  !!error && typeof error === 'object' && 'name' in error && error.name === 'NoModelError';

export const getSourceState = <T>(result: {
  data?: T[];
  loaded: boolean;
  loadError?: unknown;
}): SourceState<T> => {
  const empty: SourceState<T> = { availability: SourceAvailability.Absent, data: [] };

  if (!result?.loaded) {
    return { ...empty, availability: SourceAvailability.Loading };
  }

  const errorCode = getErrorCode(result.loadError);
  if (errorCode === 401 || errorCode === 403) {
    return { ...empty, availability: SourceAvailability.Forbidden };
  }
  if (errorCode === 404 || isMissingModelError(result.loadError)) {
    return empty;
  }
  if (result.loadError) {
    return { ...empty, availability: SourceAvailability.Error };
  }

  if (result.data == null) {
    return empty;
  }

  if (Array.isArray(result.data)) {
    return { availability: SourceAvailability.Available, data: result.data };
  }

  return empty;
};

export const isReadable = (state: SourceState<unknown>) =>
  state?.availability === SourceAvailability.Available;

export const isDegraded = (state: SourceState<unknown>) =>
  state?.availability === SourceAvailability.Forbidden ||
  state?.availability === SourceAvailability.Error;

export const getConsumersAvailability = (
  pods: SourceState<unknown>,
  virtualMachines: SourceState<unknown>,
  kubevirtEnabled: boolean,
): ConsumersAvailability => {
  if (!kubevirtEnabled) {
    return isReadable(pods) ? 'complete' : 'unavailable';
  }

  const readableSources = [pods, virtualMachines].filter(isReadable).length;
  if (readableSources === 2) return 'complete';
  if (readableSources === 1) return 'partial';
  return 'unavailable';
};
