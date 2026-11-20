import { describe, expect, it } from '@jest/globals';
import {
  PROJECT_ALLOW_POD_NETWORK_ANNOTATION,
  PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
  PROJECT_DEFAULT_NETWORK_ANNOTATION,
  PROJECT_POD_NETWORK_VALUE,
} from '@utils/resources/namespace/constants';

import {
  buildProjectNetworkSettingsPatches,
  patchSafeKey,
  ProjectNetworkSettingsFormState,
} from './utils';

const ALLOW_PATH = `/metadata/annotations/kubevirt.io~1allow-pod-network`;
const DEFAULT_PATH = `/metadata/annotations/kubevirt.io~1default-network`;

const form = (
  overrides: Partial<ProjectNetworkSettingsFormState> = {},
): ProjectNetworkSettingsFormState => ({
  allowPodNetwork: true,
  preSelectedNetwork: PROJECT_POD_NETWORK_VALUE,
  ...overrides,
});

describe('patchSafeKey', () => {
  it('escapes ~ before / so nested escapes stay valid (RFC 6902)', () => {
    expect(patchSafeKey('kubevirt.io/allow-pod-network')).toBe('kubevirt.io~1allow-pod-network');
    expect(patchSafeKey('a~b/c')).toBe('a~0b~1c');
    expect(patchSafeKey('plain')).toBe('plain');
  });
});

describe('buildProjectNetworkSettingsPatches', () => {
  it('returns no patches when annotations are missing and the form is the default', () => {
    expect(buildProjectNetworkSettingsPatches(undefined, form())).toEqual([]);
  });

  it('adds the whole annotations object when none exist and a NAD is selected', () => {
    expect(
      buildProjectNetworkSettingsPatches(undefined, form({ preSelectedNetwork: 'local-bridge' })),
    ).toEqual([
      {
        op: 'add',
        path: '/metadata/annotations',
        value: { [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'local-bridge' },
      },
    ]);
  });

  it('adds allow-pod-network=false when pod network is disabled and annotations are missing', () => {
    expect(
      buildProjectNetworkSettingsPatches(
        undefined,
        form({ allowPodNetwork: false, preSelectedNetwork: '' }),
      ),
    ).toEqual([
      {
        op: 'add',
        path: '/metadata/annotations',
        value: { [PROJECT_ALLOW_POD_NETWORK_ANNOTATION]: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE },
      },
    ]);
  });

  it('uses ~1-escaped paths when adding individual annotation keys', () => {
    const patches = buildProjectNetworkSettingsPatches(
      { 'openshift.io/display-name': 'demo' },
      form({ allowPodNetwork: false, preSelectedNetwork: 'local-bridge' }),
    );

    expect(patches).toEqual([
      {
        op: 'add',
        path: ALLOW_PATH,
        value: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
      },
      {
        op: 'add',
        path: DEFAULT_PATH,
        value: 'local-bridge',
      },
    ]);
  });

  it('tests then replaces an existing default-network annotation', () => {
    expect(
      buildProjectNetworkSettingsPatches(
        { [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'old-bridge' },
        form({ preSelectedNetwork: 'new-bridge' }),
      ),
    ).toEqual([
      { op: 'test', path: DEFAULT_PATH, value: 'old-bridge' },
      { op: 'replace', path: DEFAULT_PATH, value: 'new-bridge' },
    ]);
  });

  it('tests then removes managed annotations when returning to defaults', () => {
    expect(
      buildProjectNetworkSettingsPatches(
        {
          [PROJECT_ALLOW_POD_NETWORK_ANNOTATION]: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
          [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'local-bridge',
        },
        form(),
      ),
    ).toEqual([
      {
        op: 'test',
        path: ALLOW_PATH,
        value: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
      },
      { op: 'remove', path: ALLOW_PATH },
      { op: 'test', path: DEFAULT_PATH, value: 'local-bridge' },
      { op: 'remove', path: DEFAULT_PATH },
    ]);
  });

  it('returns no patches when the form already matches the annotations', () => {
    expect(
      buildProjectNetworkSettingsPatches(
        {
          [PROJECT_ALLOW_POD_NETWORK_ANNOTATION]: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
          [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'local-bridge',
        },
        form({ allowPodNetwork: false, preSelectedNetwork: 'local-bridge' }),
      ),
    ).toEqual([]);
  });

  it('does not emit a default-network annotation for the Pod network sentinel', () => {
    const patches = buildProjectNetworkSettingsPatches(
      { 'openshift.io/display-name': 'demo' },
      form({ preSelectedNetwork: PROJECT_POD_NETWORK_VALUE }),
    );
    expect(patches).toEqual([]);
  });
});
