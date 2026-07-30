import * as _ from 'lodash';

export const units = {};
export const validate = {};

const TYPES = {
  binaryBytes: {
    divisor: 1024,
    space: true,
    units: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'],
  },
  binaryBytesWithoutB: {
    divisor: 1024,
    space: true,
    units: ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'],
  },
  decimalBytes: {
    divisor: 1000,
    space: true,
    units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'],
  },
  decimalBytesPerSec: {
    divisor: 1000,
    space: true,
    units: ['Bps', 'KBps', 'MBps', 'GBps', 'TBps', 'PBps', 'EBps'],
  },
  decimalBytesWithoutB: {
    divisor: 1000,
    space: true,
    units: ['', 'k', 'M', 'G', 'T', 'P', 'E'],
  },
  numeric: {
    divisor: 1000,
    space: false,
    units: ['', 'k', 'm', 'b'],
  },
  packetsPerSec: {
    divisor: 1000,
    space: true,
    units: ['pps', 'kpps'],
  },
  seconds: {
    divisor: 1000,
    space: true,
    units: ['ns', 'μs', 'ms', 's'],
  },
  SI: {
    divisor: 1000,
    space: false,
    units: ['', 'k', 'M', 'G', 'T', 'P', 'E'],
  },
};

export const getType = (name) => {
  const type = TYPES[name];
  if (!_.isPlainObject(type)) {
    return {
      divisor: 1000,
      space: false,
      units: [],
    };
  }
  return type;
};

const convertBaseValueToUnits = (value, unitArray, divisor, initialUnit, preferredUnit) => {
  const sliceIndex = initialUnit ? unitArray.indexOf(initialUnit) : 0;
  const units_ = unitArray.slice(sliceIndex);

  if (preferredUnit || preferredUnit === '') {
    const unitIndex = units_.indexOf(preferredUnit);
    if (unitIndex !== -1) {
      return {
        unit: preferredUnit,
        value: value / divisor ** unitIndex,
      };
    }
  }

  let unit = units_.shift();
  while (value >= divisor && units_.length > 0) {
    value = value / divisor;
    unit = units_.shift();
  }
  return { unit, value };
};

const convertValueWithUnitsToBaseValue = (value, unitArray, divisor) => {
  const defaultReturn = { unit: '', value };
  if (typeof value !== 'string') {
    return defaultReturn;
  }

  let units_ = unitArray.slice().reverse();

  // find which unit we're given
  let truncateStringAt = -1;
  const startingUnitIndex = _.findIndex(units_, function (currentUnitValue) {
    const index = value.indexOf(currentUnitValue);
    if (index > -1) {
      truncateStringAt = index;
      return true;
    }
    return false;
  });

  if (startingUnitIndex < 0) {
    // can't parse
    return defaultReturn;
  }

  // get the numeric value & prepare unit array for conversion
  units_ = units_.slice(startingUnitIndex);
  let currentValue = _.toNumber(value.substring(0, truncateStringAt));

  let unit = units_.shift();
  while (units_.length > 0) {
    currentValue *= divisor;
    unit = units_.shift();
  }

  return { unit, value: currentValue };
};

const getDefaultFractionDigits = (value) => {
  if (value < 1) {
    return 3;
  }
  if (value < 100) {
    return 2;
  }
  return 1;
};

const formatValue = (value, options) => {
  const fractionDigits = getDefaultFractionDigits(value);
  const { locales, ...rest } = _.defaults(options, {
    maximumFractionDigits: fractionDigits,
  });

  // 2nd check converts -0 to 0.
  if (!isFinite(value) || value === 0) {
    value = 0;
  }
  return Intl.NumberFormat(locales, rest).format(value);
};

const round = (units.round = (value, fractionDigits) => {
  if (!isFinite(value)) {
    return 0;
  }
  const multiplier = Math.pow(10, fractionDigits || getDefaultFractionDigits(value));
  return Math.round(value * multiplier) / multiplier;
});

const humanize = (units.humanize = (
  value,
  typeName,
  useRound = false,
  initialUnit,
  preferredUnit,
) => {
  const type = getType(typeName);

  if (!isFinite(value)) {
    value = 0;
  }

  let converted = convertBaseValueToUnits(
    value,
    type.units,
    type.divisor,
    initialUnit,
    preferredUnit,
  );

  if (useRound) {
    converted.value = round(converted.value);
    converted = convertBaseValueToUnits(
      converted.value,
      type.units,
      type.divisor,
      converted.unit,
      preferredUnit,
    );
  }

  const formattedValue = formatValue(converted.value);

  return {
    string: type.space ? `${formattedValue} ${converted.unit}` : formattedValue + converted.unit,
    unit: converted.unit,
    value: converted.value,
  };
});

export const humanizeDecimalBytesPerSec = (v, initialUnit, preferredUnit) =>
  humanize(v, 'decimalBytesPerSec', true, initialUnit, preferredUnit);

export const humanizeNumber = (v, initialUnit, preferredUnit) =>
  humanize(v, 'numeric', true, initialUnit, preferredUnit);

units.dehumanize = (value, typeName) => {
  const type = getType(typeName);
  return convertValueWithUnitsToBaseValue(value, type.units, type.divisor);
};

validate.split = (value) => {
  const index = value.search(/([a-zA-Z]+)/g);
  let number;
  let unit;
  if (index === -1) {
    number = value;
  } else {
    number = value.slice(0, index);
    unit = value.slice(index);
  }
  return [parseFloat(number, 10), unit];
};

const validateNumber = (float = '') => {
  if (float < 0) {
    return 'must be positive';
  }
  if (!Number.isFinite(Number(float))) {
    return 'must be a number';
  }
};

export const convertToBaseValue = (value) => {
  if (!_.isString(value)) {
    return null;
  }

  const [number, unit] = validate.split(value);
  const validationError = validateNumber(number);
  if (validationError) {
    return null;
  }

  if (!unit) {
    return number;
  }

  if (unit === 'm') {
    return number / 1000;
  }

  if (TYPES.binaryBytesWithoutB.units.includes(unit)) {
    return units.dehumanize(value, 'binaryBytesWithoutB').value;
  }

  if (TYPES.decimalBytesWithoutB.units.includes(unit)) {
    return units.dehumanize(value, 'decimalBytesWithoutB').value;
  }

  return null;
};
