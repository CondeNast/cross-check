import { ValidationError } from '@cross-check/core';
import { ValidationBuilder, validators } from '@cross-check/dsl';
import { Option, unknown } from 'ts-std';
import { buildAndRun as run } from '../support';

QUnit.module('Validators (array)');

function success(): ValidationError[] {
  return [];
}

function failure(path: Option<string>, type: string, args: unknown): ValidationError {
  return {
    path: path ? path.split('.') : [],
    message: {
      key: type,
      args
    }
  };
}

QUnit.test('array', async assert => {
  let isStringArray = validators.array(validators.isString());
  assert.deepEqual(await run(isStringArray, null), [failure(null, 'type', 'array')]);
  assert.deepEqual(await run(isStringArray, 'string-is-not-arr'), [failure(null, 'type', 'array')]);
  itemTests(isStringArray, assert);
});

QUnit.test('arrayItems', async assert => {
  let isStringArray = validators.items(validators.isString());
  itemTests(isStringArray, assert);
});

async function itemTests(builder: ValidationBuilder<unknown>, assert: typeof QUnit.assert) {
  assert.deepEqual(await run(builder, []), success());
  assert.deepEqual(await run(builder, [null]), [failure('0', 'type', 'string')]);
  assert.deepEqual(await run(builder, ['']), success());
  assert.deepEqual(await run(builder, [['hello']]), [failure('0', 'type', 'string')]);
  assert.deepEqual(await run(builder, ['', null, 'item', false]), [
    failure('1', 'type', 'string'),
    failure('3', 'type', 'string')
  ]);
}
