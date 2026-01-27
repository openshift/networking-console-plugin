export type PatchItem<T> = {
  op: 'add' | 'remove' | 'replace' | 'test';
  path: string;
  value: T;
};
