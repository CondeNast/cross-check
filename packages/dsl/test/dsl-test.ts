import { ValidationDescriptor } from '@validations/core';
import validates, { and, chain } from '@validations/dsl';
import { email, factory, presence, str, uniqueness } from './support';

QUnit.module('DSL');

QUnit.test('basic DSL', assert => {
  assert.deepEqual(validates(str()), {
    factory: factory('str'),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(validates(email({ tlds: ['.com', '.net', '.org', '.edu', '.gov'] })), {
    factory: factory('email'),
    options: { tlds: ['.com', '.net', '.org', '.edu', '.gov'] },
    contexts: []
  });
});

QUnit.test('and', assert => {
  let validations: ValidationDescriptor = validates(
    str()
      .and(email({ tlds: ['.com', '.net', '.org', '.edu', '.gov'] }))
      .and(uniqueness())
  );

  let expected: ValidationDescriptor = {
    factory: and,
    options: [
      {
        factory: factory('str'),
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
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('andThen', assert => {
  let validations = validates(
    str()
      .andThen(email({ tlds: ['.com', '.net', '.org', '.edu', '.gov'] }))
      .andThen(uniqueness())
  );

  let expected: ValidationDescriptor = {
    factory: chain,
    options: [
      {
        factory: factory('str'),
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
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('validation contexts', assert => {
  assert.throws(
    () => str().on(),
    /must provide at least one validation context/
  );

  let validations = validates(
    str().and(email({ tlds: ['.com'] })).on('create', 'update')
  );

  let expected: ValidationDescriptor = {
    factory: and,
    options: [{
      factory: factory('str'),
      options: undefined,
      contexts: []
    }, {
      factory: factory('email'),
      options: { tlds: ['.com'] },
      contexts: []
    }],
    contexts: ['create', 'update']
  };

  assert.deepEqual(validations, expected);
});

QUnit.test('"and" does not mutate previously defined builder', assert => {
  let present = presence();
  let presentAndEmail = present.and(email({ tlds: ['.com'] }));
  let presentAndUnique = present.and(uniqueness());

  assert.deepEqual(validates(present), {
      factory: factory('presence'),
      options: undefined,
      contexts: []
  });

  assert.deepEqual(validates(presentAndEmail), {
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
  });

  assert.deepEqual(validates(presentAndUnique), {
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
  });
});

QUnit.test('"andThen" does not mutate previously defined builder', assert => {
  let present = presence();
  let presentAndEmail = present.andThen(email({ tlds: ['.com'] }));
  let presentAndUnique = present.andThen(uniqueness());

  assert.deepEqual(validates(present), {
    factory: factory('presence'),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(validates(presentAndEmail), {
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
  });

  assert.deepEqual(validates(presentAndUnique), {
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
  });
});

QUnit.test('"on" does not mutate previously defined builder', assert => {
  let present = presence();
  let presentOnCreate = present.on('create');
  let presentOnUpdate = present.on('update');

  assert.deepEqual(validates(present), {
    factory: factory('presence'),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(validates(presentOnCreate), {
    factory: factory('presence'),
    options: undefined,
    contexts: ['create']
  });

  assert.deepEqual(validates(presentOnUpdate), {
    factory: factory('presence'),
    options: undefined,
    contexts: ['update']
  });
});
