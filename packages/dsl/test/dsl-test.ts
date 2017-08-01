import dsl, { on, validates, ValidationDescriptors } from '@validations/dsl';

QUnit.module('DSL');

QUnit.test('basic DSL', assert => {
  let validations = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] }),
    ]
  });

  let expected: ValidationDescriptors = {
    name: [
      {
        field: 'name',
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }
    ],
    email: [
      {
        field: 'email',
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }, {
        field: 'email',
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
      validates('email'),
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  let expected: ValidationDescriptors = {
    name: [
      {
        field: 'name',
        validator: { name: 'presence', args: [] },
        keys: ['firstName', 'lastName'],
        contexts: []
      }
    ],
    email: [
      {
        field: 'email',
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      },
      {
        field: 'email',
        validator: { name: 'email', args: [] },
        keys: [],
        contexts: []
      }
    ],
    emailConfirmation: [
      {
        field: 'emailConfirmation',
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
    name: validates('presence').on('create', 'update'),
    email: on('create').do([
      validates('presence'),
      validates('email'),
    ]),
  });

  let expected: ValidationDescriptors = {
    name: [
      {
        field: 'name',
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: ['create', 'update']
      }
    ],
    email: [
      {
        field: 'email',
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: ['create']
      },
      {
        field: 'email',
        validator: { name: 'email', args: [] },
        keys: [],
        contexts: ['create']
      }
    ]
  };

  assert.deepEqual(validations, expected);
});
