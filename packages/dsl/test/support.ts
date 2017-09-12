import { unknown } from 'ts-std';

import { ValidatorFactory } from '@validations/core';
import { ValidationBuilder, validates } from '@validations/dsl';

export const presence = builder('presence');
export const str = builder('str');
export const email = builder<string, { tlds: string[] }>('email');
export const uniqueness = builder('uniqueness');

export function factory(name: string): ValidatorFactory<unknown, unknown> {
  return name as any;
}

function builder<T = unknown>(name: string): () => ValidationBuilder<T>;
function builder<T, Options>(name: string): (options: Options) => ValidationBuilder<T>;
function builder(name: string): (options: any) => ValidationBuilder<unknown> {
  return (options: any) => validates(factory(name), options);
}
