import { Dict, Nested, Option, assert, dict, flatten } from './utils';

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

export interface ValidationDescriptor {
  field: string;
  validator: { name: string, args: any[] },
  keys: Option<string[]>;
  contexts: Option<string[]>;
}

class ValidationBuilder implements ValidationBuilderDSL {
  constructor(
    private _name: string,
    private _args: any[],
    private _keys: Option<string[]> = null,
    private _contexts: Option<string[]> = null
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
    let {
      _name: name,
      _args: args,
      _keys: keys,
     _contexts: contexts
    } = this;

    return {
      field,
      validator: { name, args },
      keys,
      contexts
    };
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
