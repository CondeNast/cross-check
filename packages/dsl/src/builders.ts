import { ValidationDescriptor, ValidatorFactory } from '@validations/core';
import { assert, unknown } from 'ts-std';
import { MapErrorTransform, ValidationDescriptors, and, chain, mapError, or } from './combinators';
import { descriptor } from './internal';
import { ValidationCallback, factoryForCallback } from './validators/callback';

export type Buildable<T> = ValidationCallback<T> | ValidationBuilder<T>;

export interface ValidationBuilder<T> {
  andAlso(validation: Buildable<T>): ValidationBuilder<T>;
  or(validation: Buildable<T>): ValidationBuilder<T>;
  andThen<U extends T>(validation: Buildable<U>): ValidationBuilder<T>;
  catch(transform: MapErrorTransform): ValidationBuilder<T>;
  on(...contexts: string[]): ValidationBuilder<T>;

  /* @internal */
  build(): ValidationDescriptor<T>;
}

export function build<T>(buildable: Buildable<T>): ValidationDescriptor<T> {
  if (isCallback(buildable)) {
    return {
      factory: factoryForCallback,
      options: buildable,
      contexts: []
    };
  } else {
    return buildable.build();
  }
}

export function validates<T, Options>(factory: ValidatorFactory<T, Options>, options: Options): ValidationBuilder<T> {
  return new BaseValidationBuilder(factory, options);
}

export function extend<T>({ factory, options, contexts }: ValidationDescriptor<T, unknown>): ValidationBuilder<T> {
  if (contexts.length > 0) {
    return new OnBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else if (factory  === and) {
    return new AndBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else if (factory === or) {
    return new OrBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else if (factory === chain) {
    return new ChainBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else {
    return new BaseValidationBuilder(factory, options, contexts);
  }
}

function isCallback<T>(buildable: Buildable<T>): buildable is ValidationCallback<T> {
  return typeof buildable === 'function';
}

class BaseValidationBuilder<T, Options> implements ValidationBuilder<T> {
  constructor(protected factory: ValidatorFactory<T, Options>, protected options: Options, protected contexts: ReadonlyArray<string> = []) {
  }

  andAlso(validation: Buildable<T>): ValidationBuilder<T> {
    return new AndBuilder(and, [build(this), build(validation)], this.contexts);
  }

  or(validation: Buildable<T>): ValidationBuilder<T> {
    return new OrBuilder(or, [build(this), build(validation)], this.contexts);
  }

  andThen<U extends T>(validation: Buildable<U>): ValidationBuilder<T> {
    return new ChainBuilder(chain, [build(this), build(validation)], this.contexts);
  }

  catch(transform: MapErrorTransform): ValidationBuilder<T> {
    return new BaseValidationBuilder(mapError, { descriptor: build(this), transform }, this.contexts);
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    return new OnBuilder(this.factory, this.options, contexts);
  }

  build(): Readonly<{ factory: ValidatorFactory<T, unknown>; options: unknown; contexts: ReadonlyArray<string>; }> {
    return descriptor(this.factory, this.options, this.contexts);
  }
}

class AndBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  andAlso(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new AndBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class OrBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  or(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new OrBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class ChainBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class OnBuilder<T, Options> extends BaseValidationBuilder<T, Options> {
  constructor(factory: ValidatorFactory<T, Options>, options: Options, contexts: ReadonlyArray<string>) {
    assert(!!contexts.length, 'You must provide at least one validation context');
    super(factory, options, contexts);
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    return new OnBuilder(this.factory, this.options, contexts);
  }
}
