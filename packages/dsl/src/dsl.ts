import { Constructor, Dict, assert, dict, unknown } from 'ts-std';

export default function normalize(fields: FieldsDSL): ValidationDescriptors {
  let descriptors: ValidationDescriptors = dict();

  for (let field of Object.keys(fields)) {
    descriptors[field] = build(fields[field]!, field);
  }

  return descriptors;
}

export function validates(name: string, ...args: any[]): ValidationBuilder {
  return new SingleValidationBuilder(name, args);
}

export function on(...contexts: string[]): ValidationContextDSL {
  assert(contexts.length > 0, 'must provide at least one validation context');
  return new ValidationContext(contexts);
}

export type ValidationDSL = ValidationBuilder | ValidationBuilder[];

export type FieldsDSL = Readonly<Dict<ValidationDSL>>;

export interface ValidationBuilder {
  keys(...keys: string[]): ValidationBuilder;
  on(...contexts: string[]): ValidationBuilder;
  build(field: string): ValidationDescriptor[];
}

export interface ValidationContextDSL {
  do(validations: ReadonlyArray<ValidationBuilder>): ValidationBuilder[];
}

export type ValidationDescriptors = Dict<ValidationDescriptor[]>;

export type ValidationDescriptor = Readonly<{
  field: string;
  validator: Readonly<{ name: string, args: ReadonlyArray<unknown> }>;
  keys: ReadonlyArray<string>;
  contexts: ReadonlyArray<string>;
}>;

abstract class AbstractValidationBuilder implements ValidationBuilder {
  abstract build(field: string): ValidationDescriptor[];
  abstract keys(...keys: string[]): this;
  abstract on(...contexts: string[]): this;
}

class MultiValidationBuilder extends AbstractValidationBuilder {
  constructor(protected validations: ValidationBuilder[] = []) {
    super();
  }

  add(validation: ValidationBuilder): this {
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

  build(field: string): ValidationDescriptor[] {
    let out = [];
    for (let validation of this.validations) {
      out.push(...validation.build(field));
    }
    return out;
  }
}

export interface MultiValidationDSL extends ValidationBuilder {
  add(validation: ValidationBuilder): MultiValidationDSL;
}

export function multi(): MultiValidationDSL {
  return new MultiValidationBuilder();
}

class SingleValidationBuilder extends AbstractValidationBuilder {
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

  build(field: string): Array<Readonly<ValidationDescriptor>> {
    return [descriptor(field, this.name, this.args, this.keyList, this.contexts)];
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

  do(nested: ReadonlyArray<ValidationBuilder>): ValidationBuilder[] {
    let validations: ValidationBuilder[] = [];

    for (let builder of nested) {
      validations.push(builder.on(...this.contexts));
    }

    return validations;
  }
}

export function build(builders: ValidationDSL, field: string): ValidationDescriptor[] {
  if (Array.isArray(builders)) {
    let descriptors = [];

    for (let builder of builders) {
      descriptors.push(...builder.build(field));
    }

    return descriptors;
  } else {
    return builders.build(field);
  }
}
