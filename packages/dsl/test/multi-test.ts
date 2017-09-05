import { FieldValidationDescriptors } from '@validations/core';
import dsl, { validates } from '@validations/dsl';
import { email, presence, present } from './support';

QUnit.module('multi() - basic');

QUnit.test('a multi buildable', assert => {
  let numeric = present(validates('numeric'));

  let validations = dsl({
    name: presence,
    age: numeric
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }
    ],
    age: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      },
      {
        validator: { name: 'numeric', args: [] },
        keys: [],
        contexts: []
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('the basic scenario', assert => {
  let validations = dsl({
    name: presence,
    email: email(['.com', '.net', '.org', '.edu', '.gov'])
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

  let confirmation = presence.and(validates('confirmation'));

  let validations = dsl({
    name: presence.keys('firstName', 'lastName'),
    email: email(),
    emailConfirmation: confirmation.keys('email')
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
        validator: { name: 'presence', args: [] },
        keys: ['email'],
        contexts: []
      },
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
    name: presence.on('create', 'update'),
    email: email().on('create')
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

QUnit.test('nested multis', assert => {
  let validatesString = present(validates('string'));
  let validatesEmail = validatesString.and(validates('email'));
  let confirmation = present(validates('confirmation'));

  let validations = dsl({
    name: presence.keys('firstName', 'lastName'),
    email: validatesEmail.keys('name').on('create'),
    emailConfirmation: confirmation.keys('email')
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
        keys: ['name'],
        contexts: ['create']
      },
      {
        validator: { name: 'string', args: [] },
        keys: ['name'],
        contexts: ['create']
      },
      {
        validator: { name: 'email', args: [] },
        keys: ['name'],
        contexts: ['create']
      }
    ],
    emailConfirmation: [
      {
        validator: { name: 'presence', args: [] },
        keys: ['email'],
        contexts: []
      },
      {
        validator: { name: 'confirmation', args: [] },
        keys: ['email'],
        contexts: []
      }
    ]
  };

  assert.deepEqual(validations, expected);
});
