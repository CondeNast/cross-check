import { FieldValidationDescriptors, ValidationDescriptors } from '@validations/core';
import { dict } from 'ts-std';
import { FieldValidationBuilders } from './builders';
import { build } from './internal';

export default function normalize(fields: FieldValidationBuilders): FieldValidationDescriptors {
  let descriptors = dict<ValidationDescriptors>();

  for (let field of Object.keys(fields)) {
    descriptors[field] = build(fields[field]!);
  }

  return descriptors;
}
