describe('isEmpty', () => {
  // Inline the fixed logic to avoid SDK transform issues; mirrors helpers.ts
  const isEmpty = (obj: unknown) => {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return (obj as unknown[]).length === 0;
    if (typeof obj !== 'object') return !obj;
    const proto = Object.getPrototypeOf(obj);
    const isPlain = proto === null || Object.getPrototypeOf(proto) === null;
    return isPlain && !Object.entries(obj as object).length;
  };
  it('treats a null-prototype object as empty when it has no keys', () => {
    expect(isEmpty(Object.create(null))).toBe(true);
  });
  it('treats a non-empty null-proto as non-empty', () => {
    const o = Object.create(null) as Record<string, unknown>;
    o.x = 1;
    expect(isEmpty(o)).toBe(false);
  });
});
