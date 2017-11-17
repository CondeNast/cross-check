import { ValidationError } from '@cross-check/core';
import { validators } from '@cross-check/dsl';
import { buildAndRun as run } from '../support';

QUnit.module('Validators (nullable)');

function success(): ValidationError[] {
  return [];
}

function failure(type: string): ValidationError[] {
  return [{
    path: [],
    message: {
      key: 'type',
      args: type
    }
  }];
}

QUnit.test('nullable', async assert => {
  assert.deepEqual(await run(validators.nullable(validators.isString()), 'hello') , success());
  assert.deepEqual(await run(validators.nullable(validators.isString()), null) , success());

  assert.deepEqual(await run(validators.nullable(validators.isString()), undefined) , failure('string'));
  assert.deepEqual(await run(validators.nullable(validators.isString()), 123) , failure('string'));
});

QUnit.test('maybe', async assert => {
  assert.deepEqual(await run(validators.maybe(validators.isString()), 'hello') , success());
  assert.deepEqual(await run(validators.maybe(validators.isString()), null) , success());
  assert.deepEqual(await run(validators.maybe(validators.isString()), undefined) , success());

  assert.deepEqual(await run(validators.maybe(validators.isString()), 123) , failure('string'));
});
