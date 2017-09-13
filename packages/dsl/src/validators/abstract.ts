import { Environment, ValidationError, Validator, ValidatorFactory } from '@validations/core';
import { Task } from 'no-show';
import { ValidationBuilder, validates } from '../builders';

export interface ValidatorClass<T, Options> {
  new(env: Environment, options: Options): ValidatorInstance<T>;
}

export interface ValidatorInstance<T> {
  run(value: T): Task<ValidationError[]>;
}

export function factoryFor<T, Options>(Class: ValidatorClass<T, Options>): ValidatorFactory<T, Options> {
  return (env: Environment, options: Options): Validator<T> => {
    let validator = new Class(env, options);
    return (value: T) => validator.run(value);
  };
}

export function builderFor<T>(Class: ValidatorClass<T, void>): () => ValidationBuilder<T>;
export function builderFor<T, Options>(Class: ValidatorClass<T, Options>): (options: Options) => ValidationBuilder<T>;
export function builderFor<T, Options>(Class: ValidatorClass<T, Options>): (options: Options) => ValidationBuilder<T> {
  let factory = factoryFor(Class);

  return (options: Options) => validates(factory, options);
}
