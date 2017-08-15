import { ValidationBuilderDSL, ValidationDescriptor, ValidationDescriptors } from './dsl';
import { Dict, Nested, assert, flatten } from './utils';
import { cloneDeep } from 'lodash';

export default function extend(parent: ValidationDescriptors, extensions: FieldsExtensionsDSL): ValidationDescriptors {
  let existingDescriptors: ValidationDescriptors = cloneDeep(parent);

  for (let extensionField of Object.keys(extensions)) {
    if (parent[extensionField]) {
      existingDescriptors = mergeExtensions(extensionField, existingDescriptors, extensions);
    } else {
      existingDescriptors[extensionField] = buildValidators(extensionField, existingDescriptors, extensions);
    }
  }

  return existingDescriptors;
}

export type FieldsExtensionsDSL = Dict<Nested<ValidationBuilderDSL>>;

function mergeExtensions(extensionField: string, existingDescriptors: ValidationDescriptors, extensions: FieldsExtensionsDSL): ValidationDescriptors {
  for (let merger of flatten(extensions[extensionField])) {
    existingDescriptors = merger.merge(extensionField, existingDescriptors);
  }
  return existingDescriptors;
}

function buildValidators(extensionField: string, existingDescriptors: ValidationDescriptors, extensions: FieldsExtensionsDSL): ValidationDescriptor[] {
  let validators: ValidationDescriptor[] = existingDescriptors[extensionField] = [];

  for (let builder of flatten(extensions[extensionField])) {
    validators.push(...flatten(builder.build(extensionField)));
  }
  return validators;
}

export function append(validations: Nested<ValidationBuilderDSL>) {
  return new Append(validations);
}

export class Append implements ValidationBuilderDSL {
  constructor(private validations: Nested<ValidationBuilderDSL>) {
  }

  keys(...keys: string[]): ValidationBuilderDSL {
    throw `not implemented`;
  }

  on(...contexts: string[]): ValidationBuilderDSL {
    throw `not implemented`;
  }

  build(field: string): ValidationDescriptor {
    throw new Error(`cannot use \`append()\` when there are no existing validations defined for \`${field}\``);
  }

  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    if (Array.isArray(this.validations) && this.validations.length === 0) {
      throw new Error(`cannot use \`append()\` to add zero validations for \`${field}\``);
    }

    let validators: ValidationDescriptor[] = existing[field];

    for (let builder of flatten(this.validations)) {
      validators.push(...flatten(builder.build(field)));
    }

    existing[field] = validators;

    return existing;
  }
}

export function replace(validations: Nested<ValidationBuilderDSL>) {
  return new Replace(validations);
}

export class Replace implements ValidationBuilderDSL {
  constructor(private validations: Nested<ValidationBuilderDSL>) {
  }

  keys(...keys: string[]): ValidationBuilderDSL {
    throw `not implemented`;
  }

  on(...contexts: string[]): ValidationBuilderDSL {
    throw `not implemented`;
  }

  build(field: string): ValidationDescriptor {
    throw new Error(`cannot use \`replace()\` when there are no existing validations defined for \`${field}\``);
  }

  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    if (Array.isArray(this.validations) && this.validations.length === 0) {
      throw new Error(`cannot use \`replace()\` to remove all validations for \`${field}\``);
    }

    let validators: ValidationDescriptor[] = [];

    for (let builder of flatten(this.validations)) {
      validators.push(...flatten(builder.build(field)));
    }

    existing[field] = validators;

    return existing;
  }
}

export function remove() {
  return new Remove();
}

export class Remove implements ValidationBuilderDSL {
  constructor() {
  }

  keys(...keys: string[]): ValidationBuilderDSL {
    throw `not implemented`;
  }

  on(...contexts: string[]): ValidationBuilderDSL {
    throw `not implemented`;
  }

  build(field: string): ValidationDescriptor {
    throw new Error(`cannot use \`remove()\` when there are no existing validations defined for \`${field}\``);
  }

  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    delete existing[field];
    return existing;
  }
}
