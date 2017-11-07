# @validations/core

The core primitive data structures and functions for a validation library.

This library is used to implement `@validations/dsl`. In general, you probably want to use that library, even for primitive use-cases.

The data structures and core functions are extracted into a separate library to create a small, well-defined composition boundary. Any validators written against the interfaces in `@validations/core` will compose reliably with validators created using the higher level abstractions (including the object
oriented abstractions) provided using `@validations/dsl`.

## Composition Goals

At its core, the goal of this library is to define a validation primitive that satisfies a number of composition goals.

### Validation is More Than Schema

First, a traditional schema library is not a good replacement for a validation library. Schema libraries typically "accept" or "reject" entire entities, throwing an exception if the schema is rejected. In other words, schema libraries assume that users have attempted to produce a valid document, and provide protection **against programmer errors**.

In contrast, validation libraries provide rich, interactive error information to a human end-user, typically presented via an interactive UI.

This means that attempting to validate an entire object **must**:

- produce a list of validation errors
- identify precisely where the validation errors occured in a way that is consumable by an interactive UI
- provide the error messages in a format that can be localized into various languages and contexts

In our original design exploration for this library, we wrote:

> The accurate placement of errors in a form (a UI concern!) is a key requirement of a good validation library.

This is still a good guiding principle for this library. **A good validation library cannot avoid considering UI concerns in its core design.**

### Framework Agnostic, But Framework Friendly

This library was extracted from the requirements of a working validation system that powered Conde Nast's CMS, which is written in Ember.

One of the main goals of the extraction was to allow people to define validation rules for their forms without needing to understand Ember or its object model.

However, we wanted to make it possible to write validators that could be shared between vanilla environments and frameworks.

This mostly amounts to two concerns.

First, applications should be able to expose well-defined "services" to validations. If a validator depends on such a service, and somebody wants to use the validator in a different environment (such as React Native), they will have a clear, pure-JavaScript definition of what they will need to implement.

In practice, this means exposing things like a configuration service or feature flagging infrastructure.

Second, it should be possible to write a validator that looks up properties on an object, agnostic to how those properties should be looked up. For example, looking up a property in an [Immutable.js Map](https://facebook.github.io/immutable-js/docs/#/Map) requires the user to use `.get()`. Knockout turns computed getters into functions (to look up `firstName` on a `Person` object, you say `person.firstName()`).

In both cases, the philosophy of this library is to expose hooks on an "Environment" (see below) that framework integrators can use to abstract these distinctions. Validators receive this environment as a parameter, and if validator definitions work through the Environment (e.g. looking up properties by using `environment.get` rather than direct indexing), they will be reusable in more environments and with more kinds of data structures.

Because it can be difficult to remember to work through the environment all the time, the `@validations/dsl` library provides a number of abstractions that do the work for you. For example, the `object()` validator provided by `@validations/dsl` automatically looks up sub-properties by using `environment.get`.

### Values, Not Models

At the core, this library validates individual values, not a bunch of fields on an object like many other validation libraries.

This makes it possible to validate that a single string matches a particular format, or that a number is greater than some lower bound.

To validate an object, you validate the object as a "value" and use composition to validate its constituent parts. Several design decisions of this library make such composition possible:

- A single validator can return any number of errors. This makes it possible for a single validator to run sub-validators on sub-parts of the object in question.
- Validation errors include a `path` member, which provides the path to the place where the error occurred. Validations that validate sub-properties, like the object validator, prepend the path that they plucked off. This also allows arbitrary nesting: each validator that plucks off a sub-part of an object prepends the path it added.

Finally, this also makes arrays relatively consistent: an array validator runs the same sub-validator on every element of the array, and produces an error whose path is the index into the array.

This makes validating an array of objects containing members that are themselves arrays of objects a standard composition in this system.

Key point: **There is no distinction between a "single value" and an object or array**. A value is a value is a value. Composition takes care of the rest.

### Functional, Not Effectful

Unlike many other validation libraries, this validation library never mutates the underlying objects in order to validate them or report errors. It also does not throw exceptions in order to report validation errors like many "schema validation" libraries.

Instead, the validation process reads data from objects and produces (asynchronously) an array of error messages.

### Localization Agnostic, But Formatting Friendly

Validation libraries usually make formatting a responsibility of individual validators. This forces a hard choice: provide no localization solution at all, hardcode support for a specific localization library, or force people to write new implementations of the validations for each localization solution they want to use.

The validation process in this library produces a data structure containing enough information to create localized, formatted error messages, rather than making formatting an additional responsibility of validators.

```json
[{
  "path": ["lat"],
  "message": {
    "key": "gt",
    "args": { "expected": 0, "actual": -50 }
  }
}]
```

Validators themselves are responsible for producing these error message data structures, but not for formatting. This allows validators to remain compact and still relatively easy to write, while allowing for robust and high-quality localizations.

In practice, higher-level libraries writte on top of these primitives should expose integration with localization libraries, but validators themselves can remain agnostic to those questions.

### Different Validation Rules for Different Contexts

An article that's ready to be "published" has stricter validation rules than an article that's still a "draft". "Autosave" has a higher tolerance for invalid content than "commit". It's important to check for username uniqueness on "create" but not "update".

These are examples of the motivation for "validation contexts", which allow an application to define validations as only applying to certain contexts.

The `validate` function takes a context as a parameter, and the core validation descriptor data structure has a field to enumerate the fields in which it should be tested.

Validators themselves don't need to know about these contexts, the `validate` loop is responsible for ignoring rules that don't apply to the requested context.

## The Environment

Once you have constructed a validation descriptor, you validate a value by calling `validate(environment, value, descriptor, context)`.

The first parameter, `environment`, is an object that gets passed into each validation function.

### The `get` Function

The `Environment`'s only mandatory method is `get`. It takes an object and key and returns another value.

The simplest environment is therefore:

```ts
const SimpleEnvironment = {
  get(obj, key) {
    return obj && obj[key];
  }
}
```

As described above, this allows users of frameworks like Ember and Knockout, as well as libraries like Immutable.js, to describe how to look up properties.

Validators implemented using `@validations/dsl` automatically use this interface to look up sub-properties, which means that normally-written validators will work just fine in many environments.

### Service Functions

It is sometimes desirable to pass additional context into validators. For example, your application might have a configuration service that defines how strict a validation needs to be.

You can implement a specialized `Environment`:

```ts
const AppEnvironment {
  get(obj, key) {
    return obj && obj[key];
  }

  config = {
    strict: true
  }
}
```

Then, a validator that wants to use that service simply depends on the specialized environment. If you're using TypeScript, the type signature tells the whole story:

```ts
function format(env: AppEnvironment, options: RegExp) {
  return value => {
    return new Task(async run => {
      if (env.config.strict && options.test(value)) return;
      if (!env.config.strict && options.test(value.trim())) return;

      return [{ path: [], message: { key: 'format', args: options }}];
    });
  }
}
```

### Specialized Environments, Philosophy

By looking at the definition of this validator factory, you can tell that it can only be used with an implementation of `AppEnvironment`.

General-purpose validators should avoid relying on specialized environments, but applications should use them to be explicit about validator dependencies.

If an application wants to reuse some validator definitions in another implementation (such as a native app), the specialized environment definition will fully describe what the other implementation needs to do in order to use validator definitions built for the application.

## Validaton Contexts

> TODO

## Basic Usage

```ts
// A validator function
function format(options) {
  return value => {
    return new Task(async run => {
      if (options.regexp.test(value)) {
        return [];
      } else {
        return [{
          path: [],
          message: { key: 'format', args: options }
        }];
      }
    })
}

function formatFactory(env, options) {
  return format(options);
}

const emailDescriptor = {
  factory: formatFactory,
  options: { regexp: /\d{4}/ },
  contexts: []
};
```

## Error Messages

> TODO

## Combinators

> TODO