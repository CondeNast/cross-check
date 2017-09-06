import { ValidationDescriptors, ValidatorFactory } from '@validations/core';
import { Dict, assert, unknown } from 'ts-std';
import { Buildable, descriptor } from './internal';

export type ValidationBuilders = ValidationBuilder | ReadonlyArray<ValidationBuilder>;

export type FieldValidationBuilders = Readonly<Dict<ValidationBuilders>>;

export interface ValidationBuilder {
  and(validation: ValidationBuilder): ValidationBuilder;
  on(...contexts: string[]): ValidationBuilder;
}

/** @internal */
export class ValidationBuilder implements Buildable {
  constructor(private validations: ReadonlyArray<SingleValidationBuilder>) {
    this.validations = validations;
  }

  and(validation: ValidationBuilder): ValidationBuilder {
    return new ValidationBuilder([...this.validations, ...validation.validations]);
  }

  on(...contexts: string[]): ValidationBuilder {
    assert(contexts.length > 0, 'must provide at least one validation context');

    let validations = this.validations.map(validation => validation.on(...contexts));
    return new ValidationBuilder(validations);
  }

  build(): ValidationDescriptors {
    let out = [];
    for (let validation of this.validations) {
      out.push(...validation.build());
    }
    return out;
  }
}

class SingleValidationBuilder {
  constructor(
    protected factory: ValidatorFactory,
    protected options: unknown,
    protected contexts: string[] = []
  ) {}

  on(...contexts: string[]): SingleValidationBuilder {
    assert(contexts.length > 0, 'must provide at least one validation context');
    return this.clone(b => b.contexts = contexts);
  }

  build(): ValidationDescriptors {
    return [descriptor(this.factory, this.options, this.contexts)];
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
  return new ValidationBuilder([ new SingleValidationBuilder(factory, options) ]);
}
