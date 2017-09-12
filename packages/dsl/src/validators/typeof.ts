import { ErrorMessage, ValidatorFactory } from '@validations/core';
import { unknown } from 'ts-std';
import { factoryFor } from './abstract';
import { ValueValidator } from './value';

export type Checker<From, To extends From> = (value: From) => value is To;

export function is<From, To extends From>(checker: Checker<From, To>, info: string): ValidatorFactory<From, void> {
  return factoryFor(class extends ValueValidator<From, void> {
    validate(value: From): ErrorMessage | void {
      return checker(value) ? undefined : { key: 'type', args: info };
    }
  });
}

function isTypeOf<To>(typeOf: string): ValidatorFactory<unknown, void> {
  return is((value: unknown): value is To => typeof value === typeOf, typeOf);
}

export const isNumber = isTypeOf('number');
export const isBoolean = isTypeOf('boolean');
export const isString = isTypeOf('string');
export const isSymbol = isTypeOf('symbol');
export const isFunction = isTypeOf('function');
export const isObject = isTypeOf('object');
export const isArray = is((value: unknown): value is unknown[] => Array.isArray(value), 'array');
