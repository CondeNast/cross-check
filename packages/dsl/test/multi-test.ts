import dsl, {
  ValidationDescriptors, multi, on, validates
} from '@validations/dsl';

import { email, presence, present } from './support';

QUnit.module('multi() - basic');

QUnit.test('a multi buildable', assert => {
  let numeric = present(validates('numeric'));

  let validations = dsl({
    name: presence,
    age: numeric
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
    age: [
      {
        field: 'age',
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      },
      {
        field: 'age',
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

  let confirmation = multi().add(presence).add(validates('confirmation'));

  let validations = dsl({
    name: presence.keys('firstName', 'lastName'),
    email: email(),
    emailConfirmation: confirmation.keys('email')
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
        validator: { name: 'presence', args: [] },
        keys: ['email'],
        contexts: []
      },
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
    name: presence.on('create', 'update'),
    email: on('create').do(email()),
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

QUnit.test('"keys" does not mutate previously defined builder', assert => {
  let presenceWithKeys = multi().add(presence.keys('firstName', 'lastName'));

  let validations = dsl({
    name: presence,
    nickname: presenceWithKeys
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
    nickname: [
      {
        field: 'nickname',
        validator: { name: 'presence', args: [] },
        keys: ['firstName', 'lastName'],
        contexts: []
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('"on" does not mutate previously defined builder', assert => {
  let presenceWithContext = multi().add(presence.on('create'));

  let validations = dsl({
    name: presence,
    email: presenceWithContext
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
        contexts: ['create']
      }
    ]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('nested multis', assert => {
  let validatesString = present(validates('string'));
  let validatesEmail = multi().add(validatesString).add(validates('email'));
  let confirmation = present(validates('confirmation'));

  let validations = dsl({
    name: presence.keys('firstName', 'lastName'),
    email: validatesEmail.keys('name').on('create'),
    emailConfirmation: confirmation.keys('email')
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
        keys: ['name'],
        contexts: ['create']
      },
      {
        field: 'email',
        validator: { name: 'string', args: [] },
        keys: ['name'],
        contexts: ['create']
      },
      {
        field: 'email',
        validator: { name: 'email', args: [] },
        keys: ['name'],
        contexts: ['create']
      }
    ],
    emailConfirmation: [
      {
        field: 'emailConfirmation',
        validator: { name: 'presence', args: [] },
        keys: ['email'],
        contexts: []
      },
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
