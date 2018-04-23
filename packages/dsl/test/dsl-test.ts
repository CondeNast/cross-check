import { format } from "@cross-check/core";
import validates, {
  MapErrorTransform,
  and,
  chain,
  extend,
  factoryForCallback,
  mapError,
  or
} from "@cross-check/dsl";
import { email, factory, isEmail, presence, str, uniqueness } from "./support";

function validationCallback() {
  /* no-op */
}

QUnit.module("DSL");

QUnit.test("basic DSL", assert => {
  assert.deepEqual(validates(str()), {
    name: "str",
    factory: factory("str"),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(
    validates(email({ tlds: [".com", ".net", ".org", ".edu", ".gov"] })),
    {
      name: "email",
      factory: factory("email"),
      options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
      contexts: []
    }
  );
});

QUnit.test("andAlso", assert => {
  let validations = validates(
    str()
      .andAlso(email({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
      .andAlso(uniqueness())
      .andAlso(validationCallback)
  );

  assert.equal(
    format(validations),
    `(all (str) (email tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness) (validationCallback function() { ... }))`
  );

  let expected = {
    name: "all",
    factory: and,
    options: [
      {
        name: "str",
        factory: factory("str"),
        options: undefined,
        contexts: []
      },
      {
        name: "email",
        factory: factory("email"),
        options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
        contexts: []
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: []
      },
      {
        name: "validationCallback",
        factory: factoryForCallback,
        options: validationCallback,
        contexts: []
      }
    ],
    contexts: []
  };

  assert.deepEqual(validations, expected);
});

QUnit.test("or", assert => {
  let validations = validates(
    str()
      .or(email({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
      .or(uniqueness())
      .or(validationCallback)
  );

  assert.equal(
    format(validations),
    `(any (str) (email tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness) (validationCallback function() { ... }))`
  );

  let expected = {
    name: "any",
    factory: or,
    options: [
      {
        name: "str",
        factory: factory("str"),
        options: undefined,
        contexts: []
      },
      {
        name: "email",
        factory: factory("email"),
        options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
        contexts: []
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: []
      },
      {
        name: "validationCallback",
        factory: factoryForCallback,
        options: validationCallback,
        contexts: []
      }
    ],
    contexts: []
  };

  assert.deepEqual(validations, expected);
});

QUnit.test("andThen", assert => {
  let validations = validates(
    str()
      .andThen(isEmail({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
      .andThen(uniqueness())
      .andThen(validationCallback)
  );

  assert.equal(
    format(validations),
    `(pipe (str) (isEmail tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness) (validationCallback function() { ... }))`
  );

  let expected = {
    name: "pipe",
    factory: chain,
    options: [
      {
        name: "str",
        factory: factory("str"),
        options: undefined,
        contexts: []
      },
      {
        name: "isEmail",
        factory: factory("isEmail"),
        options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
        contexts: []
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: []
      },
      {
        name: "validationCallback",
        factory: factoryForCallback,
        options: validationCallback,
        contexts: []
      }
    ],
    contexts: []
  };

  assert.deepEqual(validations, expected);
});

QUnit.test("catch", assert => {
  const mapper: MapErrorTransform = () => [];

  let validations = validates(
    str()
      .andThen(isEmail({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
      .andThen(uniqueness())
      .catch(mapper)
  );

  assert.equal(
    format(validations),
    `(try do=(pipe (str) (isEmail tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness)) catch=function() { ... })`
  );

  let expected = {
    name: "try",
    factory: mapError,
    options: {
      catch: mapper,
      do: {
        name: "pipe",
        factory: chain,
        options: [
          {
            name: "str",
            factory: factory("str"),
            options: undefined,
            contexts: []
          },
          {
            name: "isEmail",
            factory: factory("isEmail"),
            options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
            contexts: []
          },
          {
            name: "uniqueness",
            factory: factory("uniqueness"),
            options: undefined,
            contexts: []
          }
        ],
        contexts: []
      }
    },
    contexts: []
  };

  assert.deepEqual(validations, expected);
});

QUnit.test("validation contexts", assert => {
  assert.throws(
    () => str().on(),
    /must provide at least one validation context/
  );

  let validations = validates(
    str()
      .andAlso(email({ tlds: [".com"] }))
      .on("create", "update")
      .andAlso(uniqueness().on("update"))
      .on("create", "update", "destroy")
  );

  assert.equal(
    format(validations),
    `(all (all (str) (email tlds=[".com"]))::on(create update) (uniqueness)::on(update))::on(create update destroy)`
  );

  let expected = {
    name: "all",
    factory: and,
    options: [
      {
        name: "all",
        factory: and,
        options: [
          {
            name: "str",
            factory: factory("str"),
            options: undefined,
            contexts: []
          },
          {
            name: "email",
            factory: factory("email"),
            options: { tlds: [".com"] },
            contexts: []
          }
        ],
        contexts: ["create", "update"]
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: ["update"]
      }
    ],
    contexts: ["create", "update", "destroy"]
  };

  assert.deepEqual(validations, expected);
});

QUnit.test("extend", assert => {
  let mapper: MapErrorTransform = () => [];

  let validations = validates(presence().andThen(str()));

  let extended = validates(
    extend(validations)
      .andThen(isEmail({ tlds: [".com"] }))
      .andAlso(uniqueness().on("create"))
      .catch(mapper)
  );

  assert.equal(format(validations), `(pipe (presence) (str))`);

  assert.equal(
    format(extended),
    `(try do=(all (pipe (presence) (str) (isEmail tlds=[".com"])) (uniqueness)::on(create)) catch=function() { ... })`
  );

  let expected = {
    name: "try",
    factory: mapError,
    options: {
      catch: mapper,
      do: {
        name: "all",
        factory: and,
        options: [
          {
            name: "pipe",
            factory: chain,
            options: [
              {
                name: "presence",
                factory: factory("presence"),
                options: undefined,
                contexts: []
              },
              {
                name: "str",
                factory: factory("str"),
                options: undefined,
                contexts: []
              },
              {
                name: "isEmail",
                factory: factory("isEmail"),
                options: { tlds: [".com"] },
                contexts: []
              }
            ],
            contexts: []
          },
          {
            name: "uniqueness",
            factory: factory("uniqueness"),
            options: undefined,
            contexts: ["create"]
          }
        ],
        contexts: []
      }
    },
    contexts: []
  };

  assert.deepEqual(extended, expected);
});

QUnit.test(`"andAlso" does not mutate previously defined builder`, assert => {
  let present = presence();
  let presentAndEmail = present.andAlso(email({ tlds: [".com"] }));
  let presentAndUnique = present.andAlso(uniqueness());

  assert.deepEqual(validates(present), {
    name: "presence",
    factory: factory("presence"),
    options: undefined,
    contexts: []
  });

  assert.equal(format(validates(present)), `(presence)`);

  assert.equal(
    format(validates(presentAndEmail)),
    `(all (presence) (email tlds=[".com"]))`
  );

  assert.equal(
    format(validates(presentAndUnique)),
    `(all (presence) (uniqueness))`
  );

  assert.deepEqual(validates(presentAndEmail), {
    name: "all",
    factory: and,
    options: [
      {
        name: "presence",
        factory: factory("presence"),
        options: undefined,
        contexts: []
      },
      {
        name: "email",
        factory: factory("email"),
        options: { tlds: [".com"] },
        contexts: []
      }
    ],
    contexts: []
  });

  assert.deepEqual(validates(presentAndUnique), {
    name: "all",
    factory: and,
    options: [
      {
        name: "presence",
        factory: factory("presence"),
        options: undefined,
        contexts: []
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: []
      }
    ],
    contexts: []
  });
});

QUnit.test(`"or" does not mutate previously defined builder`, assert => {
  let present = presence();
  let presentAndEmail = present.or(email({ tlds: [".com"] }));
  let presentAndUnique = present.or(uniqueness());

  assert.equal(format(validates(present)), `(presence)`);

  assert.equal(
    format(validates(presentAndEmail)),
    `(any (presence) (email tlds=[".com"]))`
  );

  assert.equal(
    format(validates(presentAndUnique)),
    `(any (presence) (uniqueness))`
  );

  assert.deepEqual(validates(present), {
    name: "presence",
    factory: factory("presence"),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(validates(presentAndEmail), {
    name: "any",
    factory: or,
    options: [
      {
        name: "presence",
        factory: factory("presence"),
        options: undefined,
        contexts: []
      },
      {
        name: "email",
        factory: factory("email"),
        options: { tlds: [".com"] },
        contexts: []
      }
    ],
    contexts: []
  });

  assert.deepEqual(validates(presentAndUnique), {
    name: "any",
    factory: or,
    options: [
      {
        name: "presence",
        factory: factory("presence"),
        options: undefined,
        contexts: []
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: []
      }
    ],
    contexts: []
  });
});

QUnit.test(`"andThen" does not mutate previously defined builder`, assert => {
  let present = presence();
  let presentAndEmail = present.andThen(isEmail({ tlds: [".com"] }));
  let presentAndUnique = present.andThen(uniqueness());

  assert.equal(format(validates(present)), `(presence)`);

  assert.equal(
    format(validates(presentAndEmail)),
    `(pipe (presence) (isEmail tlds=[".com"]))`
  );

  assert.equal(
    format(validates(presentAndUnique)),
    `(pipe (presence) (uniqueness))`
  );

  assert.deepEqual(validates(present), {
    name: "presence",
    factory: factory("presence"),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(validates(presentAndEmail), {
    name: "pipe",
    factory: chain,
    options: [
      {
        name: "presence",
        factory: factory("presence"),
        options: undefined,
        contexts: []
      },
      {
        name: "isEmail",
        factory: factory("isEmail"),
        options: { tlds: [".com"] },
        contexts: []
      }
    ],
    contexts: []
  });

  assert.deepEqual(validates(presentAndUnique), {
    name: "pipe",
    factory: chain,
    options: [
      {
        name: "presence",
        factory: factory("presence"),
        options: undefined,
        contexts: []
      },
      {
        name: "uniqueness",
        factory: factory("uniqueness"),
        options: undefined,
        contexts: []
      }
    ],
    contexts: []
  });
});

QUnit.test(`"on" does not mutate previously defined builder`, assert => {
  let present = presence();
  let presentOnCreate = present.on("create");
  let presentOnUpdate = present.on("update");

  assert.equal(format(validates(present)), `(presence)`);

  assert.equal(format(validates(presentOnCreate)), `(presence)::on(create)`);

  assert.equal(format(validates(presentOnUpdate)), `(presence)::on(update)`);

  assert.deepEqual(validates(present), {
    name: "presence",
    factory: factory("presence"),
    options: undefined,
    contexts: []
  });

  assert.deepEqual(validates(presentOnCreate), {
    name: "presence",
    factory: factory("presence"),
    options: undefined,
    contexts: ["create"]
  });

  assert.deepEqual(validates(presentOnUpdate), {
    name: "presence",
    factory: factory("presence"),
    options: undefined,
    contexts: ["update"]
  });
});
