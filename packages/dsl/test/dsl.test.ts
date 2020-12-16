import { format } from "@cross-check/core";
import validates, {
  MapErrorTransform,
  and,
  chain,
  extend,
  factoryForCallback,
  ifValid,
  mapError,
  or,
} from "@cross-check/dsl";
import { email, factory, isEmail, presence, str, uniqueness } from "./support";

function validationCallback() {
  /* no-op */
}

describe("DSL", () => {
  test("basic DSL", () => {
    expect(validates(str())).toEqual({
      name: "str",
      validator: factory("str"),
      options: undefined,
      contexts: [],
    });

    expect(
      validates(email({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
    ).toEqual({
      name: "email",
      validator: factory("email"),
      options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
      contexts: [],
    });
  });

  test("andAlso", () => {
    const validations = validates(
      str()
        .andAlso(email({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
        .andAlso(uniqueness())
        .andAlso(validationCallback)
    );

    expect(format(validations)).toEqual(
      `(all (str) (email tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness) (validationCallback function() { ... }))`
    );

    const expected = {
      name: "all",
      validator: and,
      options: [
        {
          name: "str",
          validator: factory("str"),
          options: undefined,
          contexts: [],
        },
        {
          name: "email",
          validator: factory("email"),
          options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
        {
          name: "validationCallback",
          validator: factoryForCallback,
          options: validationCallback,
          contexts: [],
        },
      ],
      contexts: [],
    };

    expect(validations).toEqual(expected);
  });

  test("or", () => {
    const validations = validates(
      str()
        .or(email({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
        .or(uniqueness())
        .or(validationCallback)
    );

    expect(format(validations)).toEqual(
      `(any (str) (email tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness) (validationCallback function() { ... }))`
    );

    const expected = {
      name: "any",
      validator: or,
      options: [
        {
          name: "str",
          validator: factory("str"),
          options: undefined,
          contexts: [],
        },
        {
          name: "email",
          validator: factory("email"),
          options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
        {
          name: "validationCallback",
          validator: factoryForCallback,
          options: validationCallback,
          contexts: [],
        },
      ],
      contexts: [],
    };

    expect(validations).toEqual(expected);
  });

  test("andThen", () => {
    const validations = validates(
      str()
        .andThen(isEmail({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
        .andThen(uniqueness())
        .andThen(validationCallback)
    );

    expect(format(validations)).toEqual(
      `(pipe (str) (isEmail tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness) (validationCallback function() { ... }))`
    );

    const expected = {
      name: "pipe",
      validator: chain,
      options: [
        {
          name: "str",
          validator: factory("str"),
          options: undefined,
          contexts: [],
        },
        {
          name: "isEmail",
          validator: factory("isEmail"),
          options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
        {
          name: "validationCallback",
          validator: factoryForCallback,
          options: validationCallback,
          contexts: [],
        },
      ],
      contexts: [],
    };

    expect(validations).toEqual(expected);
  });

  test("if", () => {
    const validations = validates(
      uniqueness()
        .if(isEmail({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
        .if(str())
    );

    expect(format(validations)).toEqual(
      `(if (str) (isEmail tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness))`
    );

    const expected = {
      name: "if",
      validator: ifValid,
      options: [
        {
          name: "str",
          validator: factory("str"),
          options: undefined,
          contexts: [],
        },
        {
          name: "isEmail",
          validator: factory("isEmail"),
          options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
      ],
      contexts: [],
    };

    expect(validations).toEqual(expected);
  });

  test("catch", () => {
    const mapper: MapErrorTransform = () => [];

    const validations = validates(
      str()
        .andThen(isEmail({ tlds: [".com", ".net", ".org", ".edu", ".gov"] }))
        .andThen(uniqueness())
        .catch(mapper)
    );

    expect(format(validations)).toEqual(
      `(try do=(pipe (str) (isEmail tlds=[".com", ".net", ".org", ".edu", ".gov"]) (uniqueness)) catch=function() { ... })`
    );

    const expected = {
      name: "try",
      validator: mapError,
      options: {
        catch: mapper,
        do: {
          name: "pipe",
          validator: chain,
          options: [
            {
              name: "str",
              validator: factory("str"),
              options: undefined,
              contexts: [],
            },
            {
              name: "isEmail",
              validator: factory("isEmail"),
              options: { tlds: [".com", ".net", ".org", ".edu", ".gov"] },
              contexts: [],
            },
            {
              name: "uniqueness",
              validator: factory("uniqueness"),
              options: undefined,
              contexts: [],
            },
          ],
          contexts: [],
        },
      },
      contexts: [],
    };

    expect(validations).toEqual(expected);
  });

  test("validation contexts", () => {
    expect(() => str().on()).toThrow(
      /must provide at least one validation context/
    );

    const validations = validates(
      str()
        .andAlso(email({ tlds: [".com"] }))
        .on("create", "update")
        .andAlso(uniqueness().on("update"))
        .on("create", "update", "destroy")
    );

    expect(format(validations)).toEqual(
      `(all (all (str) (email tlds=[".com"]))::on(create update) (uniqueness)::on(update))::on(create update destroy)`
    );

    const expected = {
      name: "all",
      validator: and,
      options: [
        {
          name: "all",
          validator: and,
          options: [
            {
              name: "str",
              validator: factory("str"),
              options: undefined,
              contexts: [],
            },
            {
              name: "email",
              validator: factory("email"),
              options: { tlds: [".com"] },
              contexts: [],
            },
          ],
          contexts: ["create", "update"],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: ["update"],
        },
      ],
      contexts: ["create", "update", "destroy"],
    };

    expect(validations).toEqual(expected);
  });

  test("extend", () => {
    const mapper: MapErrorTransform = () => [];

    const validations = validates(presence().andThen(str()));

    const extended = validates(
      extend(validations)
        .andThen(isEmail({ tlds: [".com"] }))
        .andAlso(uniqueness().on("create"))
        .catch(mapper)
    );

    expect(format(validations)).toEqual(`(pipe (presence) (str))`);

    expect(format(extended)).toEqual(
      `(try do=(all (pipe (presence) (str) (isEmail tlds=[".com"])) (uniqueness)::on(create)) catch=function() { ... })`
    );

    const expected = {
      name: "try",
      validator: mapError,
      options: {
        catch: mapper,
        do: {
          name: "all",
          validator: and,
          options: [
            {
              name: "pipe",
              validator: chain,
              options: [
                {
                  name: "presence",
                  validator: factory("presence"),
                  options: undefined,
                  contexts: [],
                },
                {
                  name: "str",
                  validator: factory("str"),
                  options: undefined,
                  contexts: [],
                },
                {
                  name: "isEmail",
                  validator: factory("isEmail"),
                  options: { tlds: [".com"] },
                  contexts: [],
                },
              ],
              contexts: [],
            },
            {
              name: "uniqueness",
              validator: factory("uniqueness"),
              options: undefined,
              contexts: ["create"],
            },
          ],
          contexts: [],
        },
      },
      contexts: [],
    };

    expect(extended).toEqual(expected);
  });

  test(`"andAlso" does not mutate previously defined builder`, () => {
    const present = presence();
    const presentAndEmail = present.andAlso(email({ tlds: [".com"] }));
    const presentAndUnique = present.andAlso(uniqueness());

    expect(validates(present)).toEqual({
      name: "presence",
      validator: factory("presence"),
      options: undefined,
      contexts: [],
    });

    expect(format(validates(present))).toEqual(`(presence)`);

    expect(format(validates(presentAndEmail))).toEqual(
      `(all (presence) (email tlds=[".com"]))`
    );

    expect(format(validates(presentAndUnique))).toEqual(
      `(all (presence) (uniqueness))`
    );

    expect(validates(presentAndEmail)).toEqual({
      name: "all",
      validator: and,
      options: [
        {
          name: "presence",
          validator: factory("presence"),
          options: undefined,
          contexts: [],
        },
        {
          name: "email",
          validator: factory("email"),
          options: { tlds: [".com"] },
          contexts: [],
        },
      ],
      contexts: [],
    });

    expect(validates(presentAndUnique)).toEqual({
      name: "all",
      validator: and,
      options: [
        {
          name: "presence",
          validator: factory("presence"),
          options: undefined,
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
      ],
      contexts: [],
    });
  });

  test(`"or" does not mutate previously defined builder`, () => {
    const present = presence();
    const presentAndEmail = present.or(email({ tlds: [".com"] }));
    const presentAndUnique = present.or(uniqueness());

    expect(format(validates(present))).toEqual(`(presence)`);

    expect(format(validates(presentAndEmail))).toEqual(
      `(any (presence) (email tlds=[".com"]))`
    );

    expect(format(validates(presentAndUnique))).toEqual(
      `(any (presence) (uniqueness))`
    );

    expect(validates(present)).toEqual({
      name: "presence",
      validator: factory("presence"),
      options: undefined,
      contexts: [],
    });

    expect(validates(presentAndEmail)).toEqual({
      name: "any",
      validator: or,
      options: [
        {
          name: "presence",
          validator: factory("presence"),
          options: undefined,
          contexts: [],
        },
        {
          name: "email",
          validator: factory("email"),
          options: { tlds: [".com"] },
          contexts: [],
        },
      ],
      contexts: [],
    });

    expect(validates(presentAndUnique)).toEqual({
      name: "any",
      validator: or,
      options: [
        {
          name: "presence",
          validator: factory("presence"),
          options: undefined,
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
      ],
      contexts: [],
    });
  });

  test(`"andThen" does not mutate previously defined builder`, () => {
    const present = presence();
    const presentAndEmail = present.andThen(isEmail({ tlds: [".com"] }));
    const presentAndUnique = present.andThen(uniqueness());

    expect(format(validates(present))).toEqual(`(presence)`);

    expect(format(validates(presentAndEmail))).toEqual(
      `(pipe (presence) (isEmail tlds=[".com"]))`
    );

    expect(format(validates(presentAndUnique))).toEqual(
      `(pipe (presence) (uniqueness))`
    );

    expect(validates(present)).toEqual({
      name: "presence",
      validator: factory("presence"),
      options: undefined,
      contexts: [],
    });

    expect(validates(presentAndEmail)).toEqual({
      name: "pipe",
      validator: chain,
      options: [
        {
          name: "presence",
          validator: factory("presence"),
          options: undefined,
          contexts: [],
        },
        {
          name: "isEmail",
          validator: factory("isEmail"),
          options: { tlds: [".com"] },
          contexts: [],
        },
      ],
      contexts: [],
    });

    expect(validates(presentAndUnique)).toEqual({
      name: "pipe",
      validator: chain,
      options: [
        {
          name: "presence",
          validator: factory("presence"),
          options: undefined,
          contexts: [],
        },
        {
          name: "uniqueness",
          validator: factory("uniqueness"),
          options: undefined,
          contexts: [],
        },
      ],
      contexts: [],
    });
  });

  test(`"on" does not mutate previously defined builder`, () => {
    const present = presence();
    const presentOnCreate = present.on("create");
    const presentOnUpdate = present.on("update");

    expect(format(validates(present))).toEqual(`(presence)`);

    expect(format(validates(presentOnCreate))).toEqual(
      `(presence)::on(create)`
    );

    expect(format(validates(presentOnUpdate))).toEqual(
      `(presence)::on(update)`
    );

    expect(validates(present)).toEqual({
      name: "presence",
      validator: factory("presence"),
      options: undefined,
      contexts: [],
    });

    expect(validates(presentOnCreate)).toEqual({
      name: "presence",
      validator: factory("presence"),
      options: undefined,
      contexts: ["create"],
    });

    expect(validates(presentOnUpdate)).toEqual({
      name: "presence",
      validator: factory("presence"),
      options: undefined,
      contexts: ["update"],
    });
  });
});
