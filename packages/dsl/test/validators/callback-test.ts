import { ErrorMessage, ValidationError } from '@validations/core';
import { buildAndRun as run } from '../support';

QUnit.module('Validators (callback)');

QUnit.test('isAlphaNumeric', async assert => {
  function isAlphaNumeric(str: string): ErrorMessage | void {
    if (!str.match(/^[a-z0-9]+$/i)) {
      return { key: 'alpha-numeric', args: undefined };
    }
  }

  function success(): ValidationError[] {
    return [];
  }

  function failure(): ValidationError[] {
    return [{
      path: [],
      message: {
        key: 'alpha-numeric',
        args: undefined
      }
    }];
  }

  assert.deepEqual(await run(isAlphaNumeric, 'hello'), success());
  assert.deepEqual(await run(isAlphaNumeric, '1337'), success());
  assert.deepEqual(await run(isAlphaNumeric, 'C0DE'), success());

  assert.deepEqual(await run(isAlphaNumeric, ''), failure());
  assert.deepEqual(await run(isAlphaNumeric, 'hello-world'), failure());
  assert.deepEqual(await run(isAlphaNumeric, '._.'), failure());
});
