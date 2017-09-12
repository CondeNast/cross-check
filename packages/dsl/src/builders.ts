import { ValidationDescriptor, ValidatorFactory } from '@validations/core';
import { assert, unknown } from 'ts-std';
import { and, chain } from './combinators';
import { descriptor } from './internal';

export function build<T>(buildable: ValidationBuilder<T>): ValidationDescriptor<T> {
  return buildable.build();
}

export type ValidationBuilders<T> =
  ValidationBuilder<T> | ReadonlyArray<ValidationBuilder<T>>;

export interface ValidationBuilder<T> {
  and(validation: ValidationBuilder<T>): ValidationBuilder<T>;
  andThen(validation: ValidationBuilder<T>): ValidationBuilder<T>;
  on(...contexts: string[]): ValidationBuilder<T>;
  build(): ValidationDescriptor<T>;
}

/** @internal */
export class AndBuilder<T> implements ValidationBuilder<T> {
  constructor(private validations: Array<ValidationBuilder<T>>, private contexts: ReadonlyArray<string> = []) {
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    return new AndBuilder(this.validations, contexts);
  }

  and<U>(validation: ValidationBuilder<U>): ValidationBuilder<T & U> {
    return new AndBuilder([...this.validations, validation] as Array<ValidationBuilder<T & U>>, this.contexts);
  }

  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder([this, validation]);
  }

  build(): ValidationDescriptor<T> {
    return descriptor(and, this.validations.map(build), this.contexts) as ValidationDescriptor<T>;
  }
}

export class ChainBuilder<T> implements ValidationBuilder<T> {
  constructor(private validations: Array<ValidationBuilder<T>>, private contexts: ReadonlyArray<string> = []) {
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    return new AndBuilder(this.validations, contexts);
  }

  and<U>(validation: ValidationBuilder<U>): ValidationBuilder<T & U> {
    return new AndBuilder([this, validation], this.contexts);
  }

  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder([...this.validations, validation], this.contexts);
  }

  build(): ValidationDescriptor<T> {
    return descriptor(chain, this.validations.map(build), this.contexts);
  }
}

class SingleValidationBuilder<T> implements ValidationBuilder<T> {
  constructor(
    protected factory: ValidatorFactory<T, unknown>,
    protected options: unknown,
    protected contexts: ReadonlyArray<string> = []
  ) {}

  and<U>(validation: ValidationBuilder<U>): ValidationBuilder<T & U> {
    return new AndBuilder([this, validation], this.contexts);
  }

  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder([this, validation], this.contexts);
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    assert(contexts.length > 0, 'must provide at least one validation context');
    return this.clone(b => b.contexts = contexts);
  }

  build(): ValidationDescriptor<T> {
    return descriptor(this.factory, this.options, this.contexts);
  }

  protected clone(callback: (builder: SingleValidationBuilder<T>) => void): SingleValidationBuilder<T> {
    let builder = new SingleValidationBuilder(
      this.factory,
      this.options,
      this.contexts
    );

    callback(builder);

    return builder;
  }
}

export function validates<T, Options>(factory: ValidatorFactory<T, Options>, options: Options): ValidationBuilder<T> {
  return new SingleValidationBuilder(factory, options);
}
