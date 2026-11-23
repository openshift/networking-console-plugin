// Resolves `@openshift-console/*` and similar imports that unit tests never exercise.
export class Dummy extends Error {
  constructor() {
    super('Dummy file for exports');
  }
}

export function useResolvedExtensions(): unknown[] {
  return [undefined, undefined, undefined];
}
