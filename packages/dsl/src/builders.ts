import { ValidationDescriptor, ValidatorFactory } from '@validations/core';
import { assert, unknown } from 'ts-std';
import { MapErrorTransform, and, chain, mapError } from './combinators';
import { descriptor } from './internal';

export function build<T>(buildable: ValidationBuilder<T>): ValidationDescriptor<T> {
  return buildable.build();
}

export type ValidationBuilders<T> =
  ValidationBuilder<T> | ReadonlyArray<ValidationBuilder<T>>;

export interface ValidationBuilder<T> {
  and(validation: ValidationBuilder<T>): ValidationBuilder<T>;
  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T>;
  catch(transform: MapErrorTransform): ValidationBuilder<T>;
  on(...contexts: string[]): ValidationBuilder<T>;

  /** @internal */
  build(): ValidationDescriptor<T>;
}

class BaseValidationBuilder<T, Options> implements ValidationBuilder<T> {
  constructor(protected factory: ValidatorFactory<T, Options>, protected options: Options, protected contexts: ReadonlyArray<string> = []) {
  }

  and(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new AndBuilder(and, [build(this), build(validation)], this.contexts);
  }

  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder(chain, [build(this), build(validation)], this.contexts);
  }

  catch(transform: MapErrorTransform): ValidationBuilder<T> {
    return new BaseValidationBuilder(mapError, { descriptor: build(this), transform }, this.contexts);
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    assert(!!contexts.length, 'You must provide at least one validation context');
    let Class = this.constructor as typeof BaseValidationBuilder;
    return new Class(this.factory, this.options, contexts);
  }

  build(): Readonly<{ factory: ValidatorFactory<T, unknown>; options: unknown; contexts: ReadonlyArray<string>; }> {
    return descriptor(this.factory, this.options, this.contexts);
  }
}

class AndBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  and(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new AndBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class ChainBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

export function validates<T, Options>(factory: ValidatorFactory<T, Options>, options: Options): ValidationBuilder<T> {
  return new BaseValidationBuilder(factory, options);
}
