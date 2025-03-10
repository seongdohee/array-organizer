import { type } from 'emnida';
import { _from } from './polyfill';

const {
  isUndefined,
  isNull,
  isFunction,
  isString,
  isArrayLikeObject,
  isIterableObject,
  isMap,
  isEmpty,
  isObject,
} = type;

export function getGlobalObject() {
  try {
    return window;
  } catch (e) {
    return global;
  }
}

export function bindToFunction(v, _this, defaultV = function() {}) {
  let f = isFunction(v) ? v : defaultV;

  if (!isUndefined(_this) && !isNull(_this)) {
    f = f.bind(_this);
  }
  return f;
}

export function _toArray(v, f, _this) {
  const _f = bindToFunction(f, _this, function(v, k) {
    return { k, v };
  });

  const arr = [];

  switch (true) {
    // array like object(String, Array, arguments ...), iterable object(Map, Set, Generator iterator ...)
    case isArrayLikeObject(v) || isIterableObject(v): {
      if (isMap(v)) {
        for (const vv of v) {
          const [k, _vv] = vv;
          arr.push(_f(_vv, k));
        }
        return arr;
      }
      return _from(v, f, _this);
    }
    default: {
      if (!isEmpty(v)) {
        // extra object
        return Object.keys(v).reduce((acc, k) => {
          acc.push(_f(v[k], k));
          return acc;
        }, arr);
      }
      return arr;
    }
  }
}

export function toNumber(v) {
  const nv = Number(v);

  if (isFinite(nv)) {
    return nv;
  }

  if (isString(v)) {
    const arr = _from(v);
    let ret = 0;

    arr.forEach(vv => {
      ret += vv.charCodeAt(0);
    });

    return ret;
  }
  return 0;
}

export function splice(v, ...args) {
  const arr = _toArray(v);
  arr.splice(...args);

  return arr;
}

export function ascOperator(v1, v2) {
  return toNumber(v1) - toNumber(v2);
}

export function descOperator(v1, v2) {
  return toNumber(v2) - toNumber(v1);
}

export function deepTruly(v, { fAtNotObject = () => {}, fAtObject = () => {} }) {
  const stacks = [{ v }];

  let stack;
  while ((stack = stacks.shift())) {
    const { container, k, v } = stack;

    switch (true) {
      // null is object
      case !isObject(v) || isNull(v): {
        // Maybe it will be most of primitive type
        if (fAtNotObject(v, k, container)) {
          return true;
        }
        break;
      }
      default: {
        if (fAtObject(v, k, container)) {
          return true;
        }

        _toArray(v, (vv, kk) => {
          stacks.push({ container: v, k: kk, v: vv });
        });
        break;
      }
    }
  }
  return false;
}
