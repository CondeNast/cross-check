import { ValidationError } from '@validations/core';
import { BasicValidator, builderFor } from '@validations/dsl';
import { Indexable, unknown } from 'ts-std';
import { buildAndRun as run } from '../support';

function isNotBlank(str: unknown): boolean {
  return typeof str === 'string' && str.trim() !== '';
}

function hasPackageName({ name }: Indexable): boolean {
  return isNotBlank(name);
}

function hasAuthor({ author }: Indexable): boolean {
  return isNotBlank(author);
}

function hasContributors({ contributors }: Indexable): boolean {
  return Array.isArray(contributors) && contributors.length > 0;
}

QUnit.module('Validators (basic)');

QUnit.test('PackageJSONValidator', async assert => {
  class PackageJSONValidator extends BasicValidator<Indexable> {
    validate(json: Indexable): ValidationError[] {
      let errors = [];

      if (!hasPackageName(json)) {
        errors.push({
          path: ['name'],
          message: {
            key: 'required',
            args: undefined
          }
        });
      }

      if (!hasAuthor(json) && !hasContributors(json)) {
        errors.push({
          path: [],
          message: {
            key: 'authorship',
            args: undefined
          }
        });
      }

      return errors;
    }
  }

  const packageJSON = builderFor(PackageJSONValidator);

  function success(): ValidationError[] {
    return [];
  }

  function packageNameFailure(): ValidationError[] {
    return [{
      path: ['name'],
      message: {
        key: 'required',
        args: undefined
      }
    }];
  }

  function authorshipFailure(): ValidationError[] {
    return [{
      path: [],
      message: {
        key: 'authorship',
        args: undefined
      }
    }];
  }

  assert.deepEqual(await run(packageJSON(), {}), [...packageNameFailure(), ...authorshipFailure()]);
  assert.deepEqual(await run(packageJSON(), { name: '@validations/dsl' }), authorshipFailure());
  assert.deepEqual(await run(packageJSON(), { author: 'Godfrey' }), packageNameFailure());
  assert.deepEqual(await run(packageJSON(), { contributors: ['Godfrey', 'Yehuda'] }), packageNameFailure());

  assert.deepEqual(await run(packageJSON(), { name: '@validations/dsl', author: 'Godfrey' }), success());
  assert.deepEqual(await run(packageJSON(), { name: '@validations/dsl', contributors: ['Godfrey', 'Yehuda'] }), success());
});
