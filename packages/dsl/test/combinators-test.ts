import { Environment, ErrorPath, ValidationDescriptor, ValidationError, Validator, ValidatorFactory } from '@cross-check/core';
import { MapErrorOptions, MapErrorTransform, and, chain, mapError, muteAll, mutePath, muteType, or } from '@cross-check/dsl';
import Task from 'no-show';
import { unknown } from 'ts-std';
import { run } from './support';

QUnit.module('Combinators');

const Success: ValidatorFactory<unknown, void> = (): Validator<unknown> => {
  return () => new Task(async () => []);
};

interface FailOptions {
  reason: string;
  path: ErrorPath;
}

const Fail: ValidatorFactory<unknown, FailOptions> = (_: Environment, { reason, path }: FailOptions) => {
  return () => new Task<ValidationError[]>(async () => [error(reason, null, path)]);
};

function descriptorFor<T>(factory: ValidatorFactory<T, void>): ValidationDescriptor<T>;
function descriptorFor<T, Options>(factory: ValidatorFactory<T, Options>, options: Options): ValidationDescriptor<T>;
function descriptorFor<T>(factory: ValidatorFactory<T, any>, options?: any): ValidationDescriptor<T> {
  return {
    factory,
    options,
    contexts: []
  };
}

function error(reason: string, args: unknown = null, path: ErrorPath = []): ValidationError {
  return {
    path,
    message: {
      key: reason,
      args
    }
  };
}

const success = () => descriptorFor(Success);
const fail = (reason: string, path: ErrorPath = []) => descriptorFor(Fail, { reason, path });

function runMulti(factory: ValidatorFactory<unknown, ValidationDescriptor[]>, descriptors: ValidationDescriptor[]): Task<ValidationError[]> {
  return run(descriptorFor(factory, descriptors), null);
}

QUnit.test('and', async assert => {
  assert.deepEqual(await runMulti(and, [success()]), []);
  assert.deepEqual(await runMulti(and, [fail('reason')]), [error('reason')]);
  assert.deepEqual(await runMulti(and, [success(), fail('reason 1'), success(), fail('reason 2'), success()]), [error('reason 1'), error('reason 2')]);
  assert.deepEqual(await runMulti(and, [fail('reason'), fail('reason'), fail('reason')]), [error('reason')]);
  assert.deepEqual(await runMulti(and, [fail('reason', ['foo']), fail('reason', ['bar'])]), [error('reason', null, ['foo']), error('reason', null, ['bar'])]);
});

QUnit.test('or', async assert => {
  assert.deepEqual(await runMulti(or, [success()]), []);
  assert.deepEqual(await runMulti(or, [fail('reason')]), [error('multiple', [[error('reason')]])]);
  assert.deepEqual(await runMulti(or, [success(), fail('reason 1'), success(), fail('reason 2'), success()]), []);
  assert.deepEqual(await runMulti(or, [fail('reason 1'), fail('reason 2'), fail('reason 3')]), [error('multiple', [[error('reason 1')], [error('reason 2')], [error('reason 3')]])]);
  assert.deepEqual(await runMulti(or, [fail('reason'), fail('reason'), fail('reason')]), [error('multiple', [[error('reason')], [error('reason')], [error('reason')]])]);
});

QUnit.test('chain', async assert => {
  assert.deepEqual(await runMulti(chain, [success()]), []);
  assert.deepEqual(await runMulti(chain, [fail('reason')]), [error('reason')]);
  assert.deepEqual(await runMulti(chain, [success(), fail('reason 1'), success(), fail('reason 2'), success()]), [error('reason 1')]);
  assert.deepEqual(await runMulti(chain, [fail('reason'), fail('reason'), fail('reason')]), [error('reason')]);
});

QUnit.test('mapError', async assert => {
  function map(descriptor: ValidationDescriptor, transform: MapErrorTransform): Task<ValidationError[]> {
    return run(descriptorFor<unknown, MapErrorOptions<unknown>>(mapError, { descriptor, transform }), null);
  }

  function cast(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, () => [error('casted')]);
  }

  function append(descriptor: ValidationDescriptor): Task<ValidationError[]> {
    return map(descriptor, errors => [...errors, error('appended')]);
  }

  assert.deepEqual(await cast(success()), []);
  assert.deepEqual(await cast(fail('reason')), [error('casted')]);

  assert.deepEqual(await append(success()), []);
  assert.deepEqual(await append(fail('reason')), [error('reason'), error('appended')]);

  assert.deepEqual(await map(success(), muteAll()), []);
  assert.deepEqual(await map(fail('reason'), muteAll()), []);

  assert.deepEqual(await map(success(), muteType('foo')), []);
  assert.deepEqual(await map(fail('foo'), muteType('foo')), []);
  assert.deepEqual(await map(fail('bar'), muteType('foo')), [error('bar')]);

  assert.deepEqual(await map(success(), mutePath(['foo', 'bar'])), []);
  assert.deepEqual(await map(fail('foo', ['foo', 'bar']), mutePath(['foo', 'bar'])), []);
  assert.deepEqual(await map(fail('foo', ['foo', 'bar', 'baz']), mutePath(['foo', 'bar'])), []);
  assert.deepEqual(await map(fail('foo', ['foo']), mutePath(['foo', 'bar'])), [error('foo', null, ['foo'])]);
  assert.deepEqual(await map(fail('foo', ['not', 'it']), mutePath(['foo', 'bar'])), [error('foo', null, ['not', 'it'])]);

  assert.deepEqual(await map(success(), mutePath(['foo', 'bar'], true)), []);
  assert.deepEqual(await map(fail('foo', ['foo', 'bar']), mutePath(['foo', 'bar'], true)), []);
  assert.deepEqual(await map(fail('foo', ['foo', 'bar', 'baz']), mutePath(['foo', 'bar'], true)), [error('foo', null, ['foo', 'bar', 'baz'])]);
  assert.deepEqual(await map(fail('foo', ['foo']), mutePath(['foo', 'bar'], true)), [error('foo', null, ['foo'])]);
  assert.deepEqual(await map(fail('foo', ['not', 'it']), mutePath(['foo', 'bar'], true)), [error('foo', null, ['not', 'it'])]);
});
