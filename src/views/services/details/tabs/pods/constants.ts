export const PROMETHEUS_BASE_PATH = window.SERVER_FLAGS.prometheusBaseURL;
export const PROMETHEUS_TENANCY_BASE_PATH = window.SERVER_FLAGS.prometheusTenancyBaseURL;

export const MILLISECONDS_TO_SECONDS_MULTIPLIER = 1000;
export const MIGRATION__PROMETHEUS_DELAY = 15 * MILLISECONDS_TO_SECONDS_MULTIPLIER;

export const PodPhase = {
  Evicted: 'Evicted',
  Failed: 'Failed',
  Pending: 'Pending',
  Running: 'Running',
  Succeeded: 'Succeeded',
  Terminating: 'Terminating',
  Unknown: 'Unknown',
} as const;

export type PodPhase = (typeof PodPhase)[keyof typeof PodPhase];
