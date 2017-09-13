import { ValidationError } from '@validations/core';
import { ValidationBuilder, validators } from '@validations/dsl';
import { Option, unknown } from 'ts-std';
import { run } from '../support';

QUnit.module('Validators (object)');

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

QUnit.test('object', async assert => {
  const geo = validators.object({
    lat: validators.isNumber(),
    long: validators.isNumber()
  });

  assert.deepEqual(await run(geo, null), [failure(null, 'type', 'object')]);
  assert.deepEqual(await run(geo, 'string-is-not-arr'), [failure(null, 'type', 'object')]);
  fieldTests(geo, assert);
});

QUnit.test('fields', async assert => {
  const geo = validators.fields({
    lat: validators.isNumber(),
    long: validators.isNumber()
  });

  fieldTests(geo, assert);
});

async function fieldTests(builder: ValidationBuilder<unknown>, assert: typeof QUnit.assert) {
  assert.deepEqual(await run(builder, { lat: 0, long: 0 }), success());
  assert.deepEqual(await run(builder, { lat: 0, long: null }), [failure('long', 'type', 'number')]);
  assert.deepEqual(await run(builder, { lat: 0, long: [0] }), [failure('long', 'type', 'number')]);

  assert.deepEqual(await run(builder, { lat: null, long: null }), [
    failure('lat', 'type', 'number'),
    failure('long', 'type', 'number')
  ]);
}
