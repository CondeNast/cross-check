import { ErrorMessage, ValidationError } from '@cross-check/core';
import { ValueValidator, builderFor, validators } from '@cross-check/dsl';
import { buildAndRun as run } from '../support';

QUnit.module('Validators (value)');

QUnit.test('FormatValidator', async assert => {
  class FormatValidator extends ValueValidator<string, RegExp> {
    validate(value: string): ErrorMessage | void {
      if (!value.match(this.options)) {
        return { key: 'format', args: this.options };
      }
    }
  }

  const format = builderFor(FormatValidator);

  const EMAIL_REGEX = /^([^\s]+)@([^\s]+){2,}\.([^\s]+){2,}$/;

  function success(): ValidationError[] {
    return [];
  }

  function emailFailure(): ValidationError[] {
    return [{
      path: [],
      message: {
        key: 'format',
        args: EMAIL_REGEX
      }
    }];
  }

  function stringFailure(): ValidationError[] {
    return [{
      path: [],
      message: {
        key: 'type',
        args: 'string'
      }
    }];
  }

  let email = validators.isString().andThen(format(/^([^\s]+)@([^\s]+){2,}\.([^\s]+){2,}$/));

  assert.deepEqual(await run(email, null), stringFailure());
  assert.deepEqual(await run(email, 'dan'), emailFailure());
  assert.deepEqual(await run(email, 'dan@example.com'), success());
});
