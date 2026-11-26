import { describe, expect, it } from '@jest/globals';
import {
  PROJECT_ALLOW_POD_NETWORK_ANNOTATION,
  PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
  PROJECT_DEFAULT_NETWORK_ANNOTATION,
  PROJECT_POD_NETWORK_VALUE,
} from '@utils/resources/nads/constants';

import {
  buildProjectNetworkSettingsPatches,
  getDesiredAnnotations,
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

const desired = (overrides: Partial<ProjectNetworkSettingsFormState> = {}) =>
  getDesiredAnnotations(form(overrides));

describe('patchSafeKey', () => {
  it('escapes ~ before / so nested escapes stay valid (RFC 6902)', () => {
    expect(patchSafeKey('kubevirt.io/allow-pod-network')).toBe('kubevirt.io~1allow-pod-network');
    expect(patchSafeKey('a~b/c')).toBe('a~0b~1c');
    expect(patchSafeKey('plain')).toBe('plain');
  });
});

describe('getDesiredAnnotations', () => {
  it('returns an empty map for the default form (pod network allowed, pod pre-selected)', () => {
    expect(desired()).toEqual({});
  });

  it('sets allow-pod-network=false when pod network is disabled', () => {
    expect(desired({ allowPodNetwork: false, preSelectedNetwork: '' })).toEqual({
      [PROJECT_ALLOW_POD_NETWORK_ANNOTATION]: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
    });
  });

  it('sets default-network when a NAD is selected', () => {
    expect(desired({ preSelectedNetwork: 'local-bridge' })).toEqual({
      [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'local-bridge',
    });
  });

  it('does not emit default-network for the Pod network sentinel', () => {
    expect(desired({ preSelectedNetwork: PROJECT_POD_NETWORK_VALUE })).toEqual({});
  });
});

describe('buildProjectNetworkSettingsPatches', () => {
  it('returns no patches when annotations are missing and the desired map is empty', () => {
    expect(buildProjectNetworkSettingsPatches(undefined, desired())).toEqual([]);
  });

  it('adds the whole annotations object when none exist and a NAD is selected', () => {
    expect(
      buildProjectNetworkSettingsPatches(
        undefined,
        desired({ preSelectedNetwork: 'local-bridge' }),
      ),
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
        desired({ allowPodNetwork: false, preSelectedNetwork: '' }),
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
      desired({ allowPodNetwork: false, preSelectedNetwork: 'local-bridge' }),
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
        desired({ preSelectedNetwork: 'new-bridge' }),
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
        desired(),
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

  it('returns no patches when the desired map already matches the annotations', () => {
    expect(
      buildProjectNetworkSettingsPatches(
        {
          [PROJECT_ALLOW_POD_NETWORK_ANNOTATION]: PROJECT_ALLOW_POD_NETWORK_FALSE_VALUE,
          [PROJECT_DEFAULT_NETWORK_ANNOTATION]: 'local-bridge',
        },
        desired({ allowPodNetwork: false, preSelectedNetwork: 'local-bridge' }),
      ),
    ).toEqual([]);
  });

  it('does not emit a default-network annotation for the Pod network sentinel', () => {
    const patches = buildProjectNetworkSettingsPatches(
      { 'openshift.io/display-name': 'demo' },
      desired({ preSelectedNetwork: PROJECT_POD_NETWORK_VALUE }),
    );
    expect(patches).toEqual([]);
  });
});
