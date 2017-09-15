import { Environment, ValidationDescriptor, ValidationError, Validator, ValidatorFactory } from '@validations/core';
import { MapErrorTransform, and, chain, mapError, or } from '@validations/dsl';
import Task from 'no-show';
import { unknown } from 'ts-std';
import { run } from './support';

QUnit.module('Combinators');

const Success: ValidatorFactory<unknown, void> = (): Validator<unknown> => {
  return () => new Task(async () => []);
};

const Fail: ValidatorFactory<unknown, string> = (_: Environment, reason: string) => {
  return () => new Task<ValidationError[]>(async () => [error(reason)]);
};

function descriptorFor<T>(factory: ValidatorFactory<T, void>): ValidationDescriptor<T>;
function descriptorFor<T, Options>(factory: ValidatorFactory<T, Options>, options: Options): ValidationDescriptor<T>;
function descriptorFor<T, Options>(factory: ValidatorFactory<T, Options>, options?: Options): ValidationDescriptor<T> {
  return {
    factory,
    options,
    contexts: []
  };
}

function error(reason: string, args: unknown = null): ValidationError {
  return {
    path: [],
    message: {
      key: reason,
      args
    }
  };
}

const success = () => descriptorFor(Success);
const fail = (reason: string) => descriptorFor(Fail, reason);

function runMulti(factory: ValidatorFactory<unknown, ValidationDescriptor[]>, descriptors: ValidationDescriptor[]): Task<ValidationError[]> {
  return run(descriptorFor(factory, descriptors), null);
}

QUnit.test('and', async assert => {
  assert.deepEqual(await runMulti(and, [success()]), []);
  assert.deepEqual(await runMulti(and, [fail('reason')]), [error('reason')]);
  assert.deepEqual(await runMulti(and, [success(), fail('reason 1'), success(), fail('reason 2'), success()]), [error('reason 1'), error('reason 2')]);
});

QUnit.test('or', async assert => {
  assert.deepEqual(await runMulti(or, [success()]), []);
  assert.deepEqual(await runMulti(or, [fail('reason')]), [error('multiple', [[error('reason')]])]);
  assert.deepEqual(await runMulti(or, [success(), fail('reason 1'), success(), fail('reason 2'), success()]), []);
  assert.deepEqual(await runMulti(or, [fail('reason 1'), fail('reason 2'), fail('reason 3')]), [error('multiple', [[error('reason 1')], [error('reason 2')], [error('reason 3')]])]);
});

QUnit.test('chain', async assert => {
  assert.deepEqual(await runMulti(chain, [success()]), []);
  assert.deepEqual(await runMulti(chain, [fail('reason')]), [error('reason')]);
  assert.deepEqual(await runMulti(chain, [success(), fail('reason 1'), success(), fail('reason 2'), success()]), [error('reason 1')]);
});

QUnit.test('mapError', async assert => {
  function map(descriptor: ValidationDescriptor, transform: MapErrorTransform): Task<ValidationError[]> {
    return run(descriptorFor(mapError, { descriptor, transform }), null);
  }

  function cast(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, () => [error('casted')]);
  }

  function silent(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, () => []);
  }

  function append(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, errors => [...errors, error('appended')]);
  }

  assert.deepEqual(await cast(success()), []);
  assert.deepEqual(await cast(fail('reason')), [error('casted')]);

  assert.deepEqual(await silent(success()), []);
  assert.deepEqual(await silent(fail('reason')), []);

  assert.deepEqual(await append(success()), []);
  assert.deepEqual(await append(fail('reason')), [error('reason'), error('appended')]);
});
