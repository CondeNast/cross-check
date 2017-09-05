import { FieldValidationDescriptors } from '@validations/core';
import dsl, { validates } from '@validations/dsl';

QUnit.module('DSL');

QUnit.test('basic DSL', assert => {
  let validations = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ]
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }
    ],
    email: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }, {
        validator: {
          name: 'email',
          args: [
            { tlds: ['.com', '.net', '.org', '.edu', '.gov'] }
          ]
        },
        keys: [],
        contexts: []
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('dependent keys', assert => {
  assert.throws(
    () => validates('foo').keys(),
    /must provide at least one dependent key/
  );

  let validations = dsl({
    name: validates('presence').keys('firstName', 'lastName'),
    email: [
      validates('presence'),
      validates('email')
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: ['firstName', 'lastName'],
        contexts: []
      }
    ],
    email: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      },
      {
        validator: { name: 'email', args: [] },
        keys: [],
        contexts: []
      }
    ],
    emailConfirmation: [
      {
        validator: { name: 'confirmation', args: [] },
        keys: ['email'],
        contexts: []
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('validation contexts', assert => {
  assert.throws(
    () => validates('foo').on(),
    /must provide at least one validation context/
  );

  let validations = dsl({
    name:
      validates('presence')
        .on('create', 'update'),
    email:
      validates('presence')
        .and(validates('email'))
        .on('create')
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: ['create', 'update']
      }
    ],
    email: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: ['create']
      },
      {
        validator: { name: 'email', args: [] },
        keys: [],
        contexts: ['create']
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('"keys" does not mutate previously defined builder', assert => {
  let presence = validates('presence');
  let presenceWithKeys = presence.keys('firstName', 'lastName');

  let validations = dsl({
    name: presence,
    nickname: presenceWithKeys
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }
    ],
    nickname: [
      {
        validator: { name: 'presence', args: [] },
        keys: ['firstName', 'lastName'],
        contexts: []
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('"on" does not mutate previously defined builder', assert => {
  let presence = validates('presence');
  let presenceWithContext = presence.on('create');

  let validations = dsl({
    name: presence,
    email: presenceWithContext
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }
    ],
    email: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: ['create']
      }
    ]
  };

  assert.deepEqual(validations, expected);
});
