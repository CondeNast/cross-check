import { ErrorMessage } from '@validations/core';
import { isIndexable as indexable, unknown } from 'ts-std';
import { ValidationBuilder, validates } from '../builders';
import { factoryFor } from './abstract';
import { ValueValidator } from './value';

export type Checker<From, To extends From> = (value: From) => value is To;

export function is<From, To extends From>(checker: Checker<From, To>, info: string): () => ValidationBuilder<From> {
  class Validator extends ValueValidator<From, void> {
    validate(value: From): ErrorMessage | void {
      return checker(value) ? undefined : { key: 'type', args: info };
    }
  }

  let builder = validates(factoryFor(Validator), undefined);

  return () => builder;
}

function isTypeOf<To>(typeOf: string): () => ValidationBuilder<unknown> {
  return is((value: unknown): value is To => typeof value === typeOf, typeOf);
}

export const isNumber = isTypeOf('number');
export const isBoolean = isTypeOf('boolean');
export const isString = isTypeOf('string');
export const isSymbol = isTypeOf('symbol');
export const isFunction = isTypeOf('function');
export const isIndexable = is(indexable, 'indexable');
export const isObject = is((value: unknown): value is object => (value !== null && typeof value === 'object'), 'object');
export const isArray = is((value: unknown): value is unknown[] => Array.isArray(value), 'array');
