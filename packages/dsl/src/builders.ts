import { ValidationDescriptor, ValidatorFactory } from '@validations/core';
import { Dict, assert, unknown } from 'ts-std';
import { and, chain } from './combinators';
import { build, descriptor } from './internal';

export type ValidationBuilders = ValidationBuilder | ReadonlyArray<ValidationBuilder>;

export type FieldValidationBuilders = Readonly<Dict<ValidationBuilders>>;

export interface ValidationBuilder {
  and(validation: ValidationBuilder): ValidationBuilder;
  chain(validation: ValidationBuilder): ValidationBuilder;
  on(...contexts: string[]): ValidationBuilder;
  build(): ValidationDescriptor;
}

/** @internal */
export class AndBuilder implements ValidationBuilder {
  constructor(private validations: ReadonlyArray<ValidationBuilder>, private contexts: ReadonlyArray<string> = []) {
  }

  on(...contexts: string[]): ValidationBuilder {
    return new AndBuilder(this.validations, contexts);
  }

  and(validation: ValidationBuilder): ValidationBuilder {
    return new AndBuilder([...this.validations, validation], this.contexts);
  }

  chain(validation: ValidationBuilder): ValidationBuilder {
    return new ChainBuilder([this, validation]);
  }

  build(): ValidationDescriptor {
    return descriptor(and, build(...this.validations), this.contexts);
  }
}

export class ChainBuilder implements ValidationBuilder {
  constructor(private validations: ReadonlyArray<ValidationBuilder>, private contexts: ReadonlyArray<string> = []) {
  }

  on(...contexts: string[]): ValidationBuilder {
    return new AndBuilder(this.validations, contexts);
  }

  and(validation: ValidationBuilder): ValidationBuilder {
    return new AndBuilder([this, validation], this.contexts);
  }

  chain(validation: ValidationBuilder): ValidationBuilder {
    return new ChainBuilder([...this.validations, validation], this.contexts);
  }

  build(): ValidationDescriptor {
    return descriptor(chain, build(...this.validations), this.contexts);
  }
}

class SingleValidationBuilder implements ValidationBuilder {
  constructor(
    protected factory: ValidatorFactory,
    protected options: unknown,
    protected contexts: ReadonlyArray<string> = []
  ) {}

  and(validation: ValidationBuilder): ValidationBuilder {
    return new AndBuilder([this, validation], this.contexts);
  }

  chain(validation: ValidationBuilder): ValidationBuilder {
    return new ChainBuilder([this, validation], this.contexts);
  }

  on(...contexts: string[]): ValidationBuilder {
    assert(contexts.length > 0, 'must provide at least one validation context');
    return this.clone(b => b.contexts = contexts);
  }

  build(): ValidationDescriptor {
    return descriptor(this.factory, this.options, this.contexts);
  }

  protected clone(callback: (builder: SingleValidationBuilder) => void): SingleValidationBuilder {
    let builder = new SingleValidationBuilder(
      this.factory,
      this.options,
      this.contexts
    );

    callback(builder);

    return builder;
  }
}

export function validates<Options>(factory: ValidatorFactory<Options>, options: Options): ValidationBuilder {
  return new SingleValidationBuilder(factory, options);
}
