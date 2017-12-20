# @cross-check/dsl

[![Build Status](https://travis-ci.org/cross-check/dsl.svg?branch=master)](https://travis-ci.org/cross-check/dsl)

A low-level validation library. Built on top of [@cross-check/core](https://github.com/tildeio/validations-core). Detailed philosophy about cross-check can be found in `@cross-check/core`.

It was originally extracted from Condé Nast's CMS and sponsored by Condé Nast.

It's largely focused on building a small, flexible, but useful core primitive for composing validations. This library focuses on ensuring that validators can be composed easily in various useful ways. The composition goals were informed by Condé Nast's working system, since the first iteration of this library successfully replaced existing validators in its production system.

The short version of the philosophy of cross-check:

- Validation is more than schema. **A good validation library cannot avoid considering UI concerns in its core design.**
- Framework agnostic, but framework friendly. Generic validators should work regardless of quirks of frameworks or libraries like immutable.js, but you should feel perfectly at home using it in vanilla js.
- Values, not models. cross-check validates values, not models, which means it's just as capable of validating that a string is in a valid format as it is capable of validating a "model" in an ORM.
- Functional, not effectful. The design of the core data structures is functional: validators are pure functions that return validation errors.
- Localization agnostic, but formatting friendly. Error messages are data structures that can be formatted, which makes it very easy to integrate them with localization libraries, but does not mandate a particular localization strategy.
- Different rules for different contexts. This means, for example, that specific field validations in an object validator can be designated as "publish" validations, and ignored when an article is a "draft".
- Async-friendly. The validation function itself is asynchronous, which makes it easy to add async behavior to a validator when you need it. For example: validating username uniqueness by hitting a web service.

The `@cross-check/core` repository unpacks these points in much greater detail.

## Install and test

`npm install`
`npm test`

## Documentation

https://tildeio.github.io/validations-dsl

You can also generate documentation locally in `docs/` by running `npm run docs`

## Sponsors

<img src="https://user-images.githubusercontent.com/56631/32398027-e2027480-c0a9-11e7-9077-c5ecca7bc39c.png" align="left"  />

cross-check was originally extracted from Condé Nast's CMS, and the work to extract it and release it as open source was funded by [**Condé Nast**](http://bit.ly/cn-rn).
