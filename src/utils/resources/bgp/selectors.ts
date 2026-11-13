export const selectorText = (selector?: Record<string, string>) =>
  Object.entries(selector || {})
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');

export const parseSelector = (value: string): Record<string, string> =>
  Object.fromEntries(
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split('=');
        return [key.trim(), rest.join('=').trim()];
      })
      .filter(([key]) => key),
  );
