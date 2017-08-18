import { ValidationBuilderDSL, ValidationDescriptor, ValidationDescriptors } from './dsl';
import { Dict, Maybe, Nested, assert, dict, flatten } from './utils';

export interface ValidationExtensionsDSL {
  merge(field: string, descriptors: ValidationDescriptor[]): ValidationDescriptor[];
}

export type Extension = ValidationExtensionsDSL | Nested<ValidationBuilderDSL>;

export type FieldsExtensionsDSL = Dict<Extension>;

export default function extend(parent: ValidationDescriptors, extensions: FieldsExtensionsDSL): ValidationDescriptors {
  let extended: ValidationDescriptors = dict();

  let fields = new Set([...Object.keys(parent), ...Object.keys(extensions)]);

  for (let field of fields) {
    let extension = normalize(extensions[field]);
    let descriptors = extension.merge(field, parent[field] || []);

    if (descriptors.length) {
      extended[field] = descriptors;
    }
  }

  return extended;
}

function normalize(extension: Extension = new Keep()): ValidationExtensionsDSL {
  if (isValidationExtension(extension)) {
    return extension;
  } else {
    return new NewField(extension);
  }
}

function isValidationExtension(value: Extension): value is ValidationExtensionsDSL {
  return typeof (value as any).merge === 'function';
}

export function append(validations: Nested<ValidationBuilderDSL>): ValidationExtensionsDSL {
  return new Append(validations);
}

class Append implements ValidationExtensionsDSL {
  constructor(private validations: Nested<ValidationBuilderDSL>) {}

  merge(field: string, existing: ValidationDescriptor[]): ValidationDescriptor[] {
    if (existing.length === 0) {
      throw new Error(`cannot use \`append()\` when there are no existing validations defined for \`${field}\``);
    }

    if (Array.isArray(this.validations) && this.validations.length === 0) {
      throw new Error(`cannot use \`append()\` to add zero validations for \`${field}\``);
    }

    let descriptors = [...existing];

    for (let builder of flatten(this.validations)) {
      descriptors.push(...flatten(builder.build(field)));
    }

    return descriptors;
  }
}

export function replace(validations: Nested<ValidationBuilderDSL>): ValidationExtensionsDSL {
  return new Replace(validations);
}

class Replace implements ValidationExtensionsDSL {
  constructor(private validations: Nested<ValidationBuilderDSL>) {}

  merge(field: string, existing: ValidationDescriptor[]): ValidationDescriptor[] {
    if (existing.length === 0) {
      throw new Error(`cannot use \`replace()\` when there are no existing validations defined for \`${field}\``);
    }

    if (Array.isArray(this.validations) && this.validations.length === 0) {
      throw new Error(`cannot use \`replace()\` to remove all validations for \`${field}\``);
    }

    let descriptors: ValidationDescriptor[] = [];

    for (let builder of flatten(this.validations)) {
      descriptors.push(...flatten(builder.build(field)));
    }

    return descriptors;
  }
}

class NewField implements ValidationExtensionsDSL {
  constructor(private validations: Nested<ValidationBuilderDSL>) {}

  merge(field: string, existing: ValidationDescriptor[]): ValidationDescriptor[] {
    if (existing.length > 0) {
      // tslint:disable-next-line:max-line-length
      throw new Error(`\`${field}\` already has existing validations; use \`append()\` or \`replace()\` to add or completely replace validations`);
    }

    let descriptors: ValidationDescriptor[] = [];

    for (let builder of flatten(this.validations)) {
      descriptors.push(...flatten(builder.build(field)));
    }

    return descriptors;
  }
}

class Keep implements ValidationExtensionsDSL {
  merge(field: string, existing: ValidationDescriptor[]): ValidationDescriptor[] {
    return existing;
  }
}

export function remove(): ValidationExtensionsDSL {
  return new Remove();
}

class Remove implements ValidationExtensionsDSL {
  merge(field: string, existing: ValidationDescriptor[]): ValidationDescriptor[] {
    if (existing.length === 0) {
      throw new Error(`cannot use \`remove()\` when there are no existing validations defined for \`${field}\``);
    }

    return [];
  }
}
