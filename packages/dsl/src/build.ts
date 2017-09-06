import { ValidationDescriptors } from '@validations/core';
import { ValidationBuilder } from './builders';
import { build as _build } from './internal';

const build: (...builders: ValidationBuilder[]) => ValidationDescriptors = _build;

export default build;
