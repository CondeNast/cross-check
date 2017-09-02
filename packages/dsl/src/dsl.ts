import { Constructor, Dict, assert, dict, unknown } from 'ts-std';
import { Nested, flatten } from './utils';

export default function normalize(fields: FieldsDSL): ValidationDescriptors {
  let descriptors: ValidationDescriptors = dict();

  for (let field of Object.keys(fields)) {
    let validators: ValidationDescriptor[] = descriptors[field] = [];

    for (let builder of flatten(fields[field]!)) {
      validators.push(...flatten(builder.build(field)));
    }
  }

  return descriptors;
}

export function validates(name: string, ...args: any[]): ValidationBuilderDSL {
  return new ValidationBuilder(name, args);
}

export function on(...contexts: string[]): ValidationContextDSL {
  assert(contexts.length > 0, 'must provide at least one validation context');
  return new ValidationContext(contexts);
}

export type FieldsDSL = Dict<Nested<ValidationBuilderDSL>>;

export interface ValidationBuilderDSL {
  keys(...keys: string[]): ValidationBuilderDSL;
  on(...contexts: string[]): ValidationBuilderDSL;
  build(field: string): Nested<ValidationDescriptor>;
}

export interface ValidationContextDSL {
  do(validations: Nested<ValidationBuilderDSL>): Nested<ValidationBuilderDSL>;
}

export type ValidationDescriptors = Dict<ValidationDescriptor[]>;

export type ValidationDescriptor = Readonly<{
  field: string;
  validator: Readonly<{ name: string, args: ReadonlyArray<unknown> }>,
  keys: ReadonlyArray<string>;
  contexts: ReadonlyArray<string>;
}>;

abstract class CustomValidationBuilder implements ValidationBuilderDSL {
  abstract build(field: string): Nested<Readonly<ValidationDescriptor>>;
  abstract keys(...keys: string[]): this;
  abstract on(...contexts: string[]): this;
}

class MultiValidationBuilder extends CustomValidationBuilder {
  constructor(protected validations: ValidationBuilderDSL[] = []) {
    super();
  }

  add(validation: ValidationBuilderDSL): this {
    let Class = this.constructor as Constructor<this>;

    return new Class([...this.validations, validation]);
  }

  keys(...keys: string[]): this {
    let Class = this.constructor as Constructor<this>;

    let validations = this.validations.map(validation => validation.keys(...keys));
    return new Class(validations);
  }

  on(...contexts: string[]): this {
    assert(contexts.length > 0, 'must provide at least one validation context');

    let Class = this.constructor as Constructor<this>;
    let validations = this.validations.map(validation => validation.on(...contexts));
    return new Class(validations);
  }

  build(field: string): Nested<ValidationDescriptor> {
    return this.validations.map(validation => validation.build(field));
  }
}

export interface MultiValidationDSL extends ValidationBuilderDSL {
  add(validation: ValidationBuilderDSL): MultiValidationDSL;
}

export function multi(): MultiValidationDSL {
  return new MultiValidationBuilder();
}

class ValidationBuilder extends CustomValidationBuilder {
  constructor(
    protected name: string,
    protected args: unknown[],
    protected keyList: string[] = [],
    protected contexts: string[] = []
  ) {
    super();
  }

  keys(...keys: string[]): this {
    assert(keys.length > 0, 'must provide at least one dependent key');
    return this.clone(b => b.keyList = keys);
  }

  on(...contexts: string[]): this {
    assert(contexts.length > 0, 'must provide at least one validation context');
    return this.clone(b => b.contexts = contexts);
  }

  build(field: string): Readonly<ValidationDescriptor> {
    return descriptor(field, this.name, this.args, this.keyList, this.contexts);
  }

  protected clone(callback: (builder: this) => void): this {
    let Class = this.constructor as Constructor<this>;

    let builder = new Class(
      this.name,
      this.args,
      this.keyList,
      this.contexts
    );

    callback(builder);

    return builder;
  }
}

function descriptor(
  field: string,
  name: string,
  _args: unknown[],
  _keys: string[],
  _contexts: string[]
): ValidationDescriptor {
  let args = Object.freeze(_args);
  let validator = Object.freeze({ name, args });
  let keys = Object.freeze(_keys);
  let contexts = Object.freeze(_contexts);

  return Object.freeze({ field, validator, keys, contexts });
}

class ValidationContext implements ValidationContextDSL {
  constructor(private contexts: string[]) {
  }

  do(nested: Nested<ValidationBuilderDSL>): ValidationBuilderDSL[] {
    let validations: ValidationBuilderDSL[] = [];

    for (let builder of flatten(nested)) {
      validations.push(builder.on(...this.contexts));
    }

    return validations;
  }
}
