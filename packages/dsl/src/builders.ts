import { ValidationDescriptors } from '@validations/core';
import { Dict, assert, unknown } from 'ts-std';
import { Buildable, descriptor } from './internal';

export type ValidationBuilders = ValidationBuilder | ReadonlyArray<ValidationBuilder>;

export type FieldValidationBuilders = Readonly<Dict<ValidationBuilders>>;

export interface ValidationBuilder {
  and(validation: ValidationBuilder): ValidationBuilder;
  keys(...keys: string[]): ValidationBuilder;
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

  keys(...keys: string[]): ValidationBuilder {
    let validations = this.validations.map(validation => validation.keys(...keys));
    return new ValidationBuilder(validations);
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
    protected name: string,
    protected args: unknown[],
    protected keyList: string[] = [],
    protected contexts: string[] = []
  ) {}

  keys(...keys: string[]): SingleValidationBuilder {
    assert(keys.length > 0, 'must provide at least one dependent key');
    return this.clone(b => b.keyList = keys);
  }

  on(...contexts: string[]): SingleValidationBuilder {
    assert(contexts.length > 0, 'must provide at least one validation context');
    return this.clone(b => b.contexts = contexts);
  }

  build(): ValidationDescriptors {
    return [descriptor(this.name, this.args, this.keyList, this.contexts)];
  }

  protected clone(callback: (builder: SingleValidationBuilder) => void): SingleValidationBuilder {
    let builder = new SingleValidationBuilder(
      this.name,
      this.args,
      this.keyList,
      this.contexts
    );

    callback(builder);

    return builder;
  }
}

export function validates(this: void, name: string, ...args: unknown[]): ValidationBuilder {
  return new ValidationBuilder([ new SingleValidationBuilder(name, args) ]);
}
