export const NETWORK_PATH = '/spec/template/spec/networks';
export const INTERFACE_PATH = '/spec/template/spec/domain/devices/interfaces';
export const INTERFACE_STATE_ABSENT = 'absent';

// https://github.com/kubevirt/api/blob/9689e71fe2bed9e7da5f165760bbbf6981cc1087/core/v1/types.go#L1277
export const PrintableVMStatus = {
  Deleting: 'Deleting',
  Migrating: 'Migrating',
  Paused: 'Paused',
  Provisioning: 'Provisioning',
  Running: 'Running',
  Starting: 'Starting',
  Stopped: 'Stopped',
  Stopping: 'Stopping',
  Terminating: 'Terminating',
  Unknown: 'Unknown',
  WaitingForReceiver: 'WaitingForReceiver',
  WaitingForVolumeBinding: 'WaitingForVolumeBinding',
} as const;

export type PrintableVMStatus = (typeof PrintableVMStatus)[keyof typeof PrintableVMStatus];

export const PrintableVMErrorStatus = {
  CrashLoopBackOff: 'CrashLoopBackOff',
  DataVolumeError: 'DataVolumeError',
  ErrImagePull: 'ErrImagePull',
  ErrorDataVolumeNotFound: 'ErrorDataVolumeNotFound',
  ErrorPvcNotFound: 'ErrorPvcNotFound',
  ErrorUnschedulable: 'ErrorUnschedulable',
  ImagePullBackOff: 'ImagePullBackOff',
} as const;

export type PrintableVMErrorStatus =
  (typeof PrintableVMErrorStatus)[keyof typeof PrintableVMErrorStatus];
