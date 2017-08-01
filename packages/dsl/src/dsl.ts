import { Dict, Nested, Opaque, assert, dict, flatten } from './utils';

export default function normalize(fields: FieldsDSL): ValidationDescriptors {
  let descriptors: ValidationDescriptors = dict();

  for (let field of Object.keys(fields)) {
    let validators: ValidationDescriptor[] = descriptors[field] = [];

    for (let builder of flatten(fields[field])) {
      validators.push(builder.build(field));
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
  build(field: string): ValidationDescriptor;
}

export interface ValidationContextDSL {
  do(validations: Nested<ValidationBuilderDSL>): Nested<ValidationBuilderDSL>;
}

export type ValidationDescriptors = Dict<ValidationDescriptor[]>;

export type ValidationDescriptor = Readonly<{
  field: string;
  validator: Readonly<{ name: string, args: ReadonlyArray<Opaque> }>,
  keys: ReadonlyArray<string>;
  contexts: ReadonlyArray<string>;
}>;

class ValidationBuilder implements ValidationBuilderDSL {
  constructor(
    private _name: string,
    private _args: Opaque[],
    private _keys: string[] = [],
    private _contexts: string[] = []
  ) {
  }

  keys(...keys: string[]): ValidationBuilderDSL {
    assert(keys.length > 0, 'must provide at least one dependent key');
    return this._clone(b => b._keys = keys);
  }

  on(...contexts: string[]): ValidationBuilderDSL {
    assert(contexts.length > 0, 'must provide at least one validation context');
    return this._clone(b => b._contexts = contexts);
  }

  build(field: string): ValidationDescriptor {
    return descriptor(field, this._name, this._args, this._keys, this._contexts);
  }

  private _clone(callback: (builder: ValidationBuilder) => void): ValidationBuilder {
    let builder = new ValidationBuilder(
      this._name,
      this._args,
      this._keys,
      this._contexts
    );

    callback(builder);

    return builder;
  }
}

function descriptor(field: string, name: string, _args: Opaque[], _keys: string[], _contexts: string[]): ValidationDescriptor {
  let args = Object.freeze(_args);
  let validator = Object.freeze({ name, args });
  let keys = Object.freeze(_keys);
  let contexts = Object.freeze(_contexts);

  return Object.freeze({ field, validator, keys, contexts });
}

class ValidationContext implements ValidationContextDSL {
  constructor(private _contexts: string[]) {
  }

  do(nested: Nested<ValidationBuilderDSL>): ValidationBuilderDSL[] {
    let validations: ValidationBuilderDSL[] = [];

    for (let builder of flatten(nested)) {
      validations.push(builder.on(...this._contexts));
    }

    return validations;
  }
}
