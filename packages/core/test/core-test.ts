import hello from '@validations/core';

QUnit.module('@validations/core tests');

QUnit.test('hello', assert => {
  assert.equal(hello(), 'Hello from @validations/core');
});
