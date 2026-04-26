import { format } from './ui-utils';
import { set, forEach } from 'lodash';
export function isObjectEmpty(obj) {
  for (const key in obj) {
    if (obj[key] !== null && obj[key] != '') {
      return false;
    }
  }
  return true;
}

export function hasEmptyKey(obj) {
  for (const key in obj) {
    if (obj[key] !== null && obj[key] === '') {
      return true;
    }
  }
  return false;
}

export function arraysEqual(a: any[], b: any[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  a.sort();
  b.sort();
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
export function getValueType(value) {
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return 'array';
    } else {
      return 'object';
    }
  } else {
    return typeof value;
  }
}

export function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString); // This will throw an error if the string is not a valid URL
    return true;
  } catch (_) {
    return false;
  }
}

// export function checkNested(...mArgs) {
//   let args = Array.prototype.slice.call(arguments, 1);
//   let obj = arguments[0];
//   for (var i = 0; i < args.length; i++) {
//     if (!obj || !obj.hasOwnProperty(args[i])) {
//       return false;
//     }
//     obj = obj[args[i]];
//   }
//   return true;
// }

export function cleanUp(obj) {
  const keys = Object.keys(obj);
  return keys.reduce((acc, key) => {
    const value = obj[key];
    const cleanKey = key.charCodeAt(0) === 0xfeff ? key.substr(1) : key;
    acc[cleanKey] = value;
    return acc;
  }, {});
}

export function oneOfListComparator(list: any[], valueToCheck: any[] | string) {
  if (valueToCheck == null) {
    return false;
  } else {
    for (let i = 0; i < list.length; i++) {
      if (valueToCheck.includes(list[i])) {
        return true;
      }
    }
    return false;
  }
}

export function allOfListComparator(list: any[], valueToCheck: any[]) {
  return (
    valueToCheck != null &&
    list.every((element) => valueToCheck.includes(element))
  );
}

export function notInListComparator(list: any[], valueToCheck: any) {
  if (valueToCheck == null) {
    return true;
  } else {
    for (let i = 0; i < list.length; i++) {
      if (valueToCheck.includes(list[i])) {
        return false;
      }
    }
    return true;
  }
}

export function areEqual(value, other) {
  // Get the value type
  const type = Object.prototype.toString.call(value);

  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(other)) return false;

  // If items are not an object or array, return false
  if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

  // Compare the length of the length of the two items
  const valueLen =
    type === '[object Array]' ? value.length : Object.keys(value).length;
  const otherLen =
    type === '[object Array]' ? other.length : Object.keys(other).length;
  if (valueLen !== otherLen) return false;

  // Compare two items
  const compare = function (item1, item2) {
    // Get the object type
    const itemType = Object.prototype.toString.call(item1);

    // If an object or array, compare recursively
    if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
      if (!areEqual(item1, item2)) return false;
    }

    // Otherwise, do a simple comparison
    else {
      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2)) return false;

      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === '[object Function]') {
        if (item1.toString() !== item2.toString()) return false;
      } else {
        if (item1 !== item2) return false;
      }
    }
    return false;
  };

  // Compare properties
  if (type === '[object Array]') {
    for (let i = 0; i < valueLen; i++) {
      if (compare(value[i], other[i]) === false) return false;
    }
  } else {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        if (compare(value[key], other[key]) === false) return false;
      }
    }
  }

  // If nothing failed, return true
  return true;
}

export function hasOnlyKeys<T extends object>(obj: T, keys: string[]): boolean {
  const objKeys = Object.keys(obj);

  // Check if every key in the object is included in the keys array
  return (
    objKeys.every((key) => keys.includes(key)) &&
    // Check if every key in the keys array exists in the object
    keys.every((key) => objKeys.includes(key))
  );
}

export function intersectArrays<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => array2.includes(item));
}

export function isEnumValue<T>(value: string, enumType: T): boolean {
  const belongsToEnum = Object.values(enumType).includes(
    value as unknown as T[keyof T]
  );
  if (!belongsToEnum) {
    throw new Error(`Value ${value} does not belong to enum ${enumType}`);
  }
  return true;
}

export function getEnumChoices<T>(
  enumObj: T
): Array<{ value: keyof T; text: string }> {
  return Object.keys(enumObj).map((key) => ({
    value: key as keyof T,
    text: format(key)
  }));
}

type Primitive = string | number | boolean | bigint | symbol | undefined | null;
export function deepCopy<
  T extends ((object | Date) & { toJSON?: () => string }) | Primitive
>(source: T, hash = new WeakMap(), path = ''): T {
  const hasOwnProp = Object.prototype.hasOwnProperty.bind(source);

  // Primitives, null, and functions
  if (
    typeof source !== 'object' ||
    source === null ||
    typeof source === 'function'
  ) {
    return source;
  }

  // Handle objects with toJSON method (like Date)
  if (typeof source.toJSON === 'function') {
    return source.toJSON() as T;
  }

  // Handle circular references
  if (hash.has(source)) {
    return hash.get(source) as T;
  }

  // Array handling
  if (Array.isArray(source)) {
    const clone = [] as any[];
    const len = source.length;
    for (let i = 0; i < len; i++) {
      clone[i] = deepCopy(source[i], hash, path + `[${i}]`);
    }
    return clone as T;
  }

  // Object handling
  const clone = Object.create(Object.getPrototypeOf(source));
  hash.set(source, clone);

  for (const key in source) {
    if (hasOwnProp(key)) {
      clone[key] = deepCopy((source as any)[key], hash, path + `.${key}`);
    }
  }

  return clone;
}

export function unflatten(flattedObject) {
  if (flattedObject) {
    const result = {};
    forEach(flattedObject, (value, key) => {
      set(result, key, value); // Lodash set creates nested paths automatically
    });
    return result;
  } else {
    return flattedObject;
  }
}
