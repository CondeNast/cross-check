import { ValidatorFactory } from '@validations/core';
import { ValidationBuilder, validates } from '@validations/dsl';

export const presence = builder('presence');
export const email = builder<{ tlds: string[] }>('email');
export const uniqueness = builder('uniqueness');

export function factory(name: string): ValidatorFactory {
  return name as any;
}

function builder(name: string): () => ValidationBuilder;
function builder<Options>(name: string): (options: Options) => ValidationBuilder;
function builder(name: string): (options: any) => ValidationBuilder {
  return (options: any) => validates(factory(name), options);
}
