export const labelPairsToRecord = (pairs: string[][]): Record<string, string> => {
  const record: Record<string, string> = {};

  for (const [key, value] of pairs) {
    const trimmedKey = key?.trim() ?? '';
    const trimmedValue = value?.trim() ?? '';

    if (!trimmedKey && !trimmedValue) {
      continue;
    }

    if (!trimmedKey) {
      throw new Error('Selector pair is missing a key');
    }

    record[trimmedKey] = trimmedValue;
  }

  return record;
};

export const recordToLabelPairs = (labels: Record<string, string> = {}): string[][] => {
  const pairs = Object.entries(labels);
  return pairs.length ? pairs : [['', '']];
};
