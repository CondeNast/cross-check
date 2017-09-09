import { ValidationDescriptors } from '@validations/core';
import validates, { and, chain } from '@validations/dsl';
import { email, factory, presence, uniqueness } from './support';

QUnit.module('DSL');

QUnit.test('basic DSL', assert => {
  let validations = validates(
    presence(),
    email({ tlds: ['.com', '.net', '.org', '.edu', '.gov'] })
  );

  let expected: ValidationDescriptors = [
    {
      factory: factory('presence'),
      options: undefined,
      contexts: []
    }, {
      factory: factory('email'),
      options: { tlds: ['.com', '.net', '.org', '.edu', '.gov'] },
      contexts: []
    }
  ];

  assert.deepEqual(validations, expected);
});

QUnit.test('and', assert => {
  let validations = validates(
    presence()
      .and(email({ tlds: ['.com', '.net', '.org', '.edu', '.gov'] }))
      .and(uniqueness())
  );

  let expected: ValidationDescriptors = [
    {
      factory: and,
      options: [
        {
          factory: factory('presence'),
          options: undefined,
          contexts: []
        }, {
          factory: factory('email'),
          options: { tlds: ['.com', '.net', '.org', '.edu', '.gov'] },
          contexts: []
        }, {
          factory: factory('uniqueness'),
          options: undefined,
          contexts: []
        }
      ],
      contexts: []
    }
  ];

  assert.deepEqual(validations, expected);
});

QUnit.test('chain', assert => {
  let validations = validates(
    presence()
      .chain(email({ tlds: ['.com', '.net', '.org', '.edu', '.gov'] }))
      .chain(uniqueness())
  );

  let expected: ValidationDescriptors = [
    {
      factory: chain,
      options: [
        {
          factory: factory('presence'),
          options: undefined,
          contexts: []
        }, {
          factory: factory('email'),
          options: { tlds: ['.com', '.net', '.org', '.edu', '.gov'] },
          contexts: []
        }, {
          factory: factory('uniqueness'),
          options: undefined,
          contexts: []
        }
      ],
      contexts: []
    }
  ];

  assert.deepEqual(validations, expected);
});

QUnit.test('validation contexts', assert => {
  assert.throws(
    () => presence().on(),
    /must provide at least one validation context/
  );

  let validations = validates(
    presence().and(email({ tlds: ['.com'] })).on('create', 'update'),
    uniqueness().on('create')
  );

  let expected: ValidationDescriptors = [
    {
      factory: and,
      options: [{
        factory: factory('presence'),
        options: undefined,
        contexts: []
      }, {
        factory: factory('email'),
        options: { tlds: ['.com'] },
        contexts: []
      }],
      contexts: ['create', 'update']
    },
    {
      factory: factory('uniqueness'),
      options: undefined,
      contexts: ['create']
    }
  ];

  assert.deepEqual(validations, expected);
});

QUnit.test('"and" does not mutate previously defined builder', assert => {
  let present = presence();
  let presentAndEmail = present.and(email({ tlds: ['.com'] }));
  let presentAndUnique = present.and(uniqueness());

  assert.deepEqual(validates(present), [
    {
      factory: factory('presence'),
      options: undefined,
      contexts: []
    }
  ]);

  assert.deepEqual(validates(presentAndEmail), [
    {
      factory: and,
      options: [
        {
          factory: factory('presence'),
          options: undefined,
          contexts: []
        }, {
          factory: factory('email'),
          options: { tlds: ['.com'] },
          contexts: []
        }
      ],
      contexts: []
    }
  ]);

  assert.deepEqual(validates(presentAndUnique), [
    {
      factory: and,
      options: [
        {
          factory: factory('presence'),
          options: undefined,
          contexts: []
        }, {
          factory: factory('uniqueness'),
          options: undefined,
          contexts: []
        }
      ],
      contexts: []
    }
  ]);
});

QUnit.test('"chain" does not mutate previously defined builder', assert => {
  let present = presence();
  let presentAndEmail = present.chain(email({ tlds: ['.com'] }));
  let presentAndUnique = present.chain(uniqueness());

  assert.deepEqual(validates(present), [
    {
      factory: factory('presence'),
      options: undefined,
      contexts: []
    }
  ]);

  assert.deepEqual(validates(presentAndEmail), [
    {
      factory: chain,
      options: [
        {
          factory: factory('presence'),
          options: undefined,
          contexts: []
        }, {
          factory: factory('email'),
          options: { tlds: ['.com'] },
          contexts: []
        }
      ],
      contexts: []
    }
  ]);

  assert.deepEqual(validates(presentAndUnique), [
    {
      factory: chain,
      options: [
        {
          factory: factory('presence'),
          options: undefined,
          contexts: []
        }, {
          factory: factory('uniqueness'),
          options: undefined,
          contexts: []
        }
      ],
      contexts: []
    }
  ]);
});

QUnit.test('"on" does not mutate previously defined builder', assert => {
  let present = presence();
  let presentOnCreate = present.on('create');
  let presentOnUpdate = present.on('update');

  assert.deepEqual(validates(present), [
    {
      factory: factory('presence'),
      options: undefined,
    contexts: []
    }
  ]);

  assert.deepEqual(validates(presentOnCreate), [
    {
      factory: factory('presence'),
      options: undefined,
      contexts: ['create']
    }
  ]);

  assert.deepEqual(validates(presentOnUpdate), [
    {
      factory: factory('presence'),
      options: undefined,
      contexts: ['update']
    }
  ]);
});
