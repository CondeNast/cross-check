import { FieldValidationDescriptors, ValidationDescriptors } from '@validations/core';
import { Dict, dict } from 'ts-std';
import { ValidationBuilders } from './builders';
import { build } from './internal';

export interface ValidationExtensionsDSL {
  merge(field: string, descriptors: ValidationDescriptors): ValidationDescriptors;
}

export type Extension = ValidationExtensionsDSL | ValidationBuilders;

export type FieldsExtensionsDSL = Dict<Extension>;

export default function extend(parent: FieldValidationDescriptors, extensions: FieldsExtensionsDSL): FieldValidationDescriptors {
  let extended = dict<ValidationDescriptors>();

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

export function append(validations: ValidationBuilders): ValidationExtensionsDSL {
  return new Append(validations);
}

class Append implements ValidationExtensionsDSL {
  constructor(private validations: ValidationBuilders) {}

  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    if (existing.length === 0) {
      throw new Error(`cannot use \`append()\` when there are no existing validations defined for \`${field}\``);
    }

    if (Array.isArray(this.validations) && this.validations.length === 0) {
      throw new Error(`cannot use \`append()\` to add zero validations for \`${field}\``);
    }

    return [...existing, ...build(this.validations)];
  }
}

export function replace(validations: ValidationBuilders): ValidationExtensionsDSL {
  return new Replace(validations);
}

class Replace implements ValidationExtensionsDSL {
  constructor(private validations: ValidationBuilders) {}

  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    if (existing.length === 0) {
      throw new Error(`cannot use \`replace()\` when there are no existing validations defined for \`${field}\``);
    }

    if (Array.isArray(this.validations) && this.validations.length === 0) {
      throw new Error(`cannot use \`replace()\` to remove all validations for \`${field}\``);
    }

    return build(this.validations);
  }
}

class NewField implements ValidationExtensionsDSL {
  constructor(private validations: ValidationBuilders) {}

  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    if (existing.length > 0) {
      // tslint:disable-next-line:max-line-length
      throw new Error(`\`${field}\` already has existing validations; use \`append()\` or \`replace()\` to add or completely replace validations`);
    }

    return build(this.validations);
  }
}

class Keep implements ValidationExtensionsDSL {
  merge(_field: string, existing: ValidationDescriptors): ValidationDescriptors {
    return existing;
  }
}

export function remove(): ValidationExtensionsDSL {
  return new Remove();
}

class Remove implements ValidationExtensionsDSL {
  merge(field: string, existing: ValidationDescriptors): ValidationDescriptors {
    if (existing.length === 0) {
      throw new Error(`cannot use \`remove()\` when there are no existing validations defined for \`${field}\``);
    }

    return [];
  }
}
