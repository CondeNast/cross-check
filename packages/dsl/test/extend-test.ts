import { FieldValidationDescriptors } from '@validations/core';
import dsl, { append, extend, remove, replace, validates } from '@validations/dsl';

QUnit.module('extensions');

QUnit.test('introducing new fields', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ]
  });

  let child = extend(parent, {
    password: [
      validates('presence'),
      validates('password', { lowerCase: true, upperCase: true, numbers: true, symbols: true })
    ],
    passwordConfirmation: validates('confirmation').keys('password')
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
    ],
    password: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }, {
        validator: {
          name: 'password',
          args: [
            { lowerCase: true, upperCase: true, numbers: true, symbols: true }
          ]
        },
        keys: [],
        contexts: []
      }
    ],
    passwordConfirmation: [
      {
        validator: { name: 'confirmation', args: [] },
        keys: ['password'],
        contexts: []
      }
    ]
  };

  assert.deepEqual(child, expected);
});

QUnit.test('must use append/replace to modify existing validations', assert => {
  let parent = dsl({
    name: validates('presence')
  });

  assert.throws(() => {
    extend(parent, {
      name: validates('length', 6)
    });
  // tslint:disable-next-line:max-line-length
  }, /`name` already has existing validations; use `append\(\)` or `replace\(\)` to add or completely replace validations/);
});

QUnit.test('append new validations when none exist', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  assert.throws(() => {
    extend(parent, {
      password: append(validates('password'))
    });
  }, /cannot use `append\(\)` when there are no existing validations defined for `password`/);

});

QUnit.test('append existing validations with no validations', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  assert.throws(() => {
    extend(parent, {
      emailConfirmation: append([])
    });
  }, /cannot use `append\(\)` to add zero validations for `emailConfirmation`/);
});

QUnit.test('append new validations', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  let child = extend(parent, {
    name: append([
      validates('length', 6),
      validates('uniqueness').on('create')
    ]),
    email: append(validates('length', 6))
  });

  let expected: FieldValidationDescriptors = {
    name: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      },
      {
        validator: { name: 'length', args: [6] },
        keys: [],
        contexts: []
      },
      {
        validator: { name: 'uniqueness', args: [] },
        keys: [],
        contexts: ['create']
      }
    ],
    email: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }, {
        validator: { name: 'email', args: [{ tlds: ['.com', '.net', '.org', '.edu', '.gov'] }] },
        keys: [],
        contexts: []
      },
      {
        validator: { name: 'length', args: [6] },
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

  assert.deepEqual(child, expected);
});

QUnit.test('replacing existing validations when none exist', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  assert.throws(() => {
    extend(parent, {
      password: replace(validates('password'))
    });
  }, /cannot use `replace\(\)` when there are no existing validations defined for `password`/);

});

QUnit.test('replacing existing validations with no validations', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  assert.throws(() => {
    extend(parent, {
      emailConfirmation: replace([])
    });
  }, /cannot use `replace\(\)` to remove all validations for `emailConfirmation`/);
});

QUnit.test('replacing existing validations', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  let child = extend(parent, {
    email: replace([
      validates('presence'),
      validates('email', { tlds: ['.com'] })
    ]),
    emailConfirmation: replace([
      validates('presence')
    ])
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
        validator: { name: 'email', args: [{ tlds: ['.com'] }] },
        keys: [],
        contexts: []
      }
    ],
    emailConfirmation: [
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }
    ]
  };

  assert.deepEqual(child, expected);
});

QUnit.test('removing existing validations when none exist', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  assert.throws(() => {
    extend(parent, {
      password: remove()
    });
  }, /cannot use `remove\(\)` when there are no existing validations defined for `password`/);

});

QUnit.test('removing existing validations', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  let child = extend(parent, {
    email: replace([
      validates('presence'),
      validates('email', { tlds: ['.com'] })
    ]),
    emailConfirmation: remove()
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
        validator: { name: 'email', args: [{ tlds: ['.com'] }] },
        keys: [],
        contexts: []
      }
    ]
  };

  assert.deepEqual(child, expected);
});

QUnit.test('extending existing validations does not mutate parent', assert => {
  let parent = dsl({
    name: validates('presence'),
    email: [
      validates('presence'),
      validates('email', { tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
    ],
    emailConfirmation: validates('confirmation').keys('email')
  });

  let expectedParent: FieldValidationDescriptors = {
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
        validator: { name: 'email', args: [{ tlds: ['.com', '.net', '.org', '.edu', '.gov'] }] },
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

  assert.deepEqual(parent, expectedParent, 'parent does not match before extending');

  let child = extend(parent, {
    email: replace([
      validates('presence'),
      validates('email', { tlds: ['.com'] })
    ]),
    emailConfirmation: append([
      validates('presence')
    ])
  });

  let expectedChild: FieldValidationDescriptors = {
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
        validator: { name: 'email', args: [{ tlds: ['.com'] }] },
        keys: [],
        contexts: []
      }
    ],
    emailConfirmation: [
      {
        validator: { name: 'confirmation', args: [] },
        keys: ['email'],
        contexts: []
      },
      {
        validator: { name: 'presence', args: [] },
        keys: [],
        contexts: []
      }]
  };

  assert.deepEqual(child, expectedChild, 'child does not match after extending');
  assert.deepEqual(parent, expectedParent, 'parent does not match after extending');
});
