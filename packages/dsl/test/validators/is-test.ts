import { ValidationError } from '@validations/core';
import { validators } from '@validations/dsl';
import { run } from '../support';

QUnit.module('Validators (is)');

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

QUnit.test('isNumber', async assert => {
  assert.deepEqual(await run(validators.isNumber(), 5) , success());
  assert.deepEqual(await run(validators.isNumber(), 3.14) , success());
  assert.deepEqual(await run(validators.isNumber(), NaN) , success());

  assert.deepEqual(await run(validators.isNumber(), null) , failure('number'));
  assert.deepEqual(await run(validators.isNumber(), undefined) , failure('number'));
  assert.deepEqual(await run(validators.isNumber(), '5') , failure('number'));
});

QUnit.test('isBoolean', async assert => {
  assert.deepEqual(await run(validators.isBoolean(), true) , success());
  assert.deepEqual(await run(validators.isBoolean(), false) , success());

  assert.deepEqual(await run(validators.isBoolean(), null) , failure('boolean'));
  assert.deepEqual(await run(validators.isBoolean(), undefined) , failure('boolean'));
  assert.deepEqual(await run(validators.isBoolean(), 'true') , failure('boolean'));
});

QUnit.test('isString', async assert => {
  assert.deepEqual(await run(validators.isString(), 'hello') , success());
  assert.deepEqual(await run(validators.isString(), '') , success());

  assert.deepEqual(await run(validators.isString(), null) , failure('string'));
  assert.deepEqual(await run(validators.isString(), undefined) , failure('string'));
  // tslint:disable-next-line:no-construct
  assert.deepEqual(await run(validators.isString(), new String('hello')) , failure('string'));
});

QUnit.test('isSymbol', async assert => {
  assert.deepEqual(await run(validators.isSymbol(), Symbol('hello' )) , success());
  assert.deepEqual(await run(validators.isSymbol(), Symbol(123)) , success());
  assert.deepEqual(await run(validators.isSymbol(), Symbol()) , success());

  assert.deepEqual(await run(validators.isSymbol(), null) , failure('symbol'));
  assert.deepEqual(await run(validators.isSymbol(), undefined) , failure('symbol'));
  assert.deepEqual(await run(validators.isSymbol(), 'hello') , failure('symbol'));
});

QUnit.test('isFunction', async assert => {
  // tslint:disable-next-line:only-arrow-functions
  assert.deepEqual(await run(validators.isFunction(), function() { /**/ }) , success());
  assert.deepEqual(await run(validators.isFunction(), () => { /**/ }) , success());
  assert.deepEqual(await run(validators.isFunction(), new Function()) , success());

  assert.deepEqual(await run(validators.isFunction(), null) , failure('function'));
  assert.deepEqual(await run(validators.isFunction(), undefined) , failure('function'));
  assert.deepEqual(await run(validators.isFunction(), 'hello') , failure('function'));
});

QUnit.test('isIndexable', async assert => {
  assert.deepEqual(await run(validators.isIndexable(), []) , success());
  assert.deepEqual(await run(validators.isIndexable(), {}) , success());
  assert.deepEqual(await run(validators.isIndexable(), new (class {})()) , success());
  assert.deepEqual(await run(validators.isIndexable(), new Date()) , success());
  // tslint:disable-next-line:no-construct
  assert.deepEqual(await run(validators.isIndexable(), new String()) , success());
  assert.deepEqual(await run(validators.isIndexable(), () => { /**/ }) , success());
  assert.deepEqual(await run(validators.isIndexable(), new Function()) , success());

  assert.deepEqual(await run(validators.isIndexable(), null) , failure('indexable'));
  assert.deepEqual(await run(validators.isIndexable(), undefined) , failure('indexable'));
  assert.deepEqual(await run(validators.isIndexable(), 'hello') , failure('indexable'));
});

QUnit.test('isObject', async assert => {
  assert.deepEqual(await run(validators.isObject(), []) , success());
  assert.deepEqual(await run(validators.isObject(), {}) , success());
  assert.deepEqual(await run(validators.isObject(), new (class {})()) , success());
  assert.deepEqual(await run(validators.isObject(), new Date()) , success());
  // tslint:disable-next-line:no-construct
  assert.deepEqual(await run(validators.isObject(), new String()) , success());

  assert.deepEqual(await run(validators.isObject(), null) , failure('object'));
  assert.deepEqual(await run(validators.isObject(), undefined) , failure('object'));
  assert.deepEqual(await run(validators.isObject(), 'hello') , failure('object'));
  assert.deepEqual(await run(validators.isObject(), () => { /**/ }) , failure('object'));
  assert.deepEqual(await run(validators.isObject(), new Function()) , failure('object'));
});

QUnit.test('isArray', async assert => {
  assert.deepEqual(await run(validators.isArray(), []), success());
  assert.deepEqual(await run(validators.isArray(), [1, 2, 3]) , success());
  assert.deepEqual(await run(validators.isArray(), new Array()) , success());

  assert.deepEqual(await run(validators.isArray(), null) , failure('array'));
  assert.deepEqual(await run(validators.isArray(), undefined) , failure('array'));
  assert.deepEqual(await run(validators.isArray(), 'hello') , failure('array'));
});
