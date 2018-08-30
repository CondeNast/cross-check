import {
  KnownValidatorFactory,
  ValidationDescriptor,
  ValidatorFactory
} from "@cross-check/core";
import { assert } from "ts-std";
import {
  MapErrorOptions,
  MapErrorTransform,
  and,
  chain,
  ifValid,
  mapError,
  or
} from "./combinators";
import { descriptor } from "./internal";
import { FIXME } from "./utils";
import { ValidationCallback, factoryForCallback } from "./validators/callback";

/**
 * @api public
 *
 * A validation that can be passed to one of the methods on ValidationBuilder.
 *
 * It's either another ValidationBuilder or a callback, which allows a more inline
 * style of composing validation chains.
 */
export type ValidationBuildable<T = unknown, U extends T = T> =
  | ValidationCallback<T>
  | Buildable<T, U>
  | ValidationDescriptor<T, U>;

export const BUILD = Symbol("BUILD");

export interface Buildable<T = unknown, U extends T = T> {
  [BUILD](): ValidationDescriptor<T, U>;
}

/**
 * @api public
 *
 * The main API for building validations. In general, always depend on this interface,
 * rather than concrete implementations of the interface.
 */
export interface ValidationBuilder<In, Out extends In = In>
  extends Buildable<In, Out> {
  name: string;

  /**
   * @api public
   *
   * Run two validations. If at least one validation fails, the composed validation
   * fails. If both validations fail, the composed validation produces the errors
   * from both validations, concatenated together.
   *
   * @param validation
   */
  andAlso<NewIn, NewOut extends NewIn>(
    validation: ValidationBuildable<NewIn, NewOut>
  ): ValidationBuilder<In & NewIn, Out & NewOut>;

  /**
   * @api public
   *
   * Run a validation. If the validation fails, run the second validation. If both
   * validations succeed, the composed validation produces no errors. Otherwise, produce
   * a "multi" validation that includes the errors for any validation that failed.
   */
  or<NewIn, NewOut extends NewIn>(
    validation: ValidationBuildable<NewIn, NewOut>
  ): ValidationBuilder<In & NewIn, In & NewIn & (Out | NewOut)>;

  /**
   * Runs the left-hand validation only if the right-hand validation succeeds. If the
   * right-hand validation fails, the whole validation succeeds.
   *
   * TODO: Explain why
   *
   * @api public
   */
  if<NewIn, NewOut extends NewIn>(
    validation: ValidationBuildable<NewIn, NewOut>
  ): ValidationBuilder<NewIn, Out>;

  /**
   * @api public
   *
   * Run a validation. If the validation fails, the composed validator produces
   * the errors for that validation. If the first validation succeeds,
   * run the second validation. If that validation fails, the composed validation
   * produces the errors for the second validation.
   *
   * The intent of this API is to allow "piping" validators together, so the first
   * validator can validate something like "it's a string", while the second validator
   * can validate specific characteristics of the string ("it's an email") and assume
   * that the string validation has already been taken care of.
   */
  andThen<NewIn extends In, NewOut extends NewIn>(
    validation: ValidationBuilder<NewIn, Out & NewOut>
  ): ValidationBuilder<In, Out & NewOut>;

  /**
   * @api public
   *
   * Convert low-level errors for an existing validation into higher-level errors.
   *
   * For example, let's say you wrote an `email` validation that looks like:
   *
   * ```ts
   * const email = string().andThen(format(EMAIL_REGEXP));
   * ```
   *
   * In this case, the `email` validation will produce either "must be a string"
   * or "invalid format (regexp)". You can use `catch` to convert those low-level
   * errors into something higher level:
   *
   * ```ts
   * const email =
   *   string()
   *     .andThen(format(EMAIL_REGEXP))
   *     .catch(errors => [{ path: [], message: { key: 'email', args: null } }])
   * ```
   *
   * Note that the `.catch` transformer will only run if there is at least
   * one validation error.
   */
  catch(transform: MapErrorTransform): ValidationBuilder<In>;

  /**
   * @api public
   *
   * Mark a validation as only relevant to a particular validation context.
   *
   * For example, let's say you have `draft` and `published` contexts. The
   * `draft` context describes validations that must pass when saving, even
   * as a draft, while the `published` context describes validations that
   * must pass only when an article is ready to be published.
   *
   * You could write a validation like:
   *
   * ```ts
   * const article = object({
   *   headline: string().andThen(validHeadline()).on('draft')
   *   body: string().andThen(validArticle()).on('published')
   * })
   * ```
   *
   * This validation would require that an article has two fields:
   *
   * - a `headline` that is a string and a valid headline (another
   *   validation), which must pass validation even when saving as
   *   a draft.
   * - a `body` that is a string and a valid article (yet another
   *   validation), but which only needs to pass validation when
   *   finally publishing the article.
   */
  on(...contexts: string[]): ValidationBuilder<In>;

  [BUILD](): ValidationDescriptor<In, Out>;
}

/**
 * @api public
 *
 * The main entry point for building validations. It takes a validation builder
 * or validation callback, and converts it into a validation descriptor.
 *
 * Validation descriptors can be passed into `validates()`, a function provided
 * by the `@cross-check/core` library.
 *
 * In essence, `@cross-check/dsl` provides a builder API for conveniently
 * constructing validation descriptors, which can then be used directly by
 * the core validation library.
 */

export function build<T, U extends T = T>(
  builder: ValidationBuilder<T, U> | ValidationDescriptor<T, U>,
  name?: string
): ValidationDescriptor<T, U>;
export function build<T>(
  buildable: ValidationCallback<T>,
  name?: string
): ValidationDescriptor<T, T>;
export function build<T, U extends T = T>(
  buildable: ValidationBuildable<T, U>,
  name?: string
): ValidationDescriptor<T, U> {
  if (isCallback(buildable)) {
    name = name || buildable.name || "anonymous";

    return {
      name,
      validator: (factoryForCallback as FIXME<any>) as ValidatorFactory<T, U>,
      options: buildable,
      contexts: []
    };
  } else if (isBuilder<T>(buildable)) {
    return buildable[BUILD]();
  } else {
    return buildable;
  }
}

export function validates<T, U extends T, Options>(
  name: string,
  factory: KnownValidatorFactory<T, U, Options>,
  options: Options
): ValidationBuilder<T> {
  return new BaseValidationBuilder(name, factory, options) as FIXME<
    ValidationBuilder<T>
  >;
}

/**
 * @api public
 *
 * Take a validation descriptor previously built using `build()` and add additional validations
 * to it.
 *
 * ```ts
 * let validations = build(
 *    required().andThen(string())
 * );
 *
 * let uniqueEmail =
 *   uniqueness()
 *     .on('create')
 *     .catch(errors => [{ path: [], message: { key: 'unique-email', args: null } }])
 *
 * let extended = build(
 *   extend(validations)
 *     .andThen(email({ tlds: ['.com'] }))
 *     .andAlso(uniqueEmail);
 * );
 * ```
 *
 * In this example, we start with a very simple validation that says that the value being validated
 * is required and also must be a string. We then extend it with more sophisticated requirements:
 * it must be an email, it must be a unique username in the database on the server (when creating the
 * record).
 *
 * The idea is that you export validation descriptors once you're done with them (using `build()`),
 * and then you can enhance them with additional functionality using `extend()`.
 *
 * In other words, `extend()` turns a validation descriptor back into a builder that can be modified
 * again.
 */
export function extend<T, U extends T = T>({
  name,
  validator,
  options,
  contexts
}: ValidationDescriptor<T, any, U>): ValidationBuilder<T> {
  if (validator === and) {
    return new AndBuilder("all", validator, options, contexts);
  } else if (validator === or) {
    return new OrBuilder("any", validator, options, contexts);
  } else if (validator === chain) {
    return new ChainBuilder("pipe", validator, options, contexts);
  } else {
    return new BaseValidationBuilder(
      `extends ${name}`,
      validator,
      options,
      contexts
    );
  }
}

function isCallback<T>(
  buildable: ValidationBuildable<T>
): buildable is ValidationCallback<T> {
  return typeof buildable === "function";
}

function isBuilder<T>(buildable: any): buildable is Buildable<T> {
  return typeof buildable[BUILD] === "function";
}

export function builderForDescriptor<T, U extends T>(
  desc: ValidationDescriptor<T, U>
): ValidationBuilder<T, U> {
  return new BaseValidationBuilder(
    desc.name,
    desc.validator,
    desc.options,
    desc.contexts
  );
}

class BaseValidationBuilder<T, U extends T, Options>
  implements ValidationBuilder<T, U> {
  constructor(
    public name: string,
    protected factory: KnownValidatorFactory<T, U, Options>,
    protected options: Options,
    protected contexts: ReadonlyArray<string> = []
  ) {}

  andAlso(validation: ValidationBuildable<T, U>): ValidationBuilder<T, U> {
    return new AndBuilder(
      "all",
      and,
      [
        build(this) as ValidationDescriptor,
        build(validation) as ValidationDescriptor
      ],
      this.contexts
    );
  }

  or(validation: ValidationBuildable<T, U>): ValidationBuilder<T, U> {
    return new OrBuilder(
      "any",
      or,
      [
        build(this) as ValidationDescriptor,
        build(validation) as ValidationDescriptor
      ],
      this.contexts
    );
  }

  if<U>(validation: ValidationBuildable<U>): ValidationBuilder<U, U> {
    return new IfValidBuilder(
      "if",
      ifValid,
      [
        build(validation) as ValidationDescriptor,
        build(this) as ValidationDescriptor
      ],
      this.contexts
    );
  }

  andThen<U extends T, V extends U>(
    validation: ValidationBuildable<U, V>
  ): ValidationBuilder<T, V> {
    return new ChainBuilder(
      "pipe",
      chain,
      [
        build(this) as ValidationDescriptor,
        build(validation) as ValidationDescriptor
      ],
      this.contexts
    );
  }

  catch(onError: MapErrorTransform): ValidationBuilder<T, U> {
    return new BaseValidationBuilder<T, MapErrorOptions<T>>(
      "try",
      mapError,
      { do: build(this), catch: onError },
      this.contexts
    );
  }

  on(...contexts: string[]): BaseValidationBuilder<T, U, Options> {
    assert(
      !!contexts.length,
      "You must provide at least one validation context"
    );

    return new OnBuilder(this.name, this.factory, this.options, contexts);
  }

  [BUILD](): ValidationDescriptor<T, U> {
    return descriptor(this.name, this.factory, this.options, this.contexts);
  }
}

class IfValidBuilder<T> extends BaseValidationBuilder<
  T,
  ReadonlyArray<ValidationDescriptor>
> {
  if<U>(validation: ValidationBuildable<U>): ValidationBuilder<U> {
    return new IfValidBuilder(
      "if",
      ifValid,
      [build(validation) as ValidationDescriptor, ...this.options],
      this.contexts
    );
  }
}

class AndBuilder<T> extends BaseValidationBuilder<
  T,
  ReadonlyArray<ValidationDescriptor>
> {
  andAlso(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new AndBuilder(
      "all",
      this.factory,
      [...this.options, build(validation) as ValidationDescriptor],
      this.contexts
    );
  }
}

class OrBuilder<T> extends BaseValidationBuilder<
  T,
  ReadonlyArray<ValidationDescriptor>
> {
  or<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new OrBuilder(
      "any",
      this.factory,
      [...this.options, build(validation) as ValidationDescriptor],
      this.contexts
    );
  }
}

class ChainBuilder<T, U extends T> extends BaseValidationBuilder<
  T,
  U,
  ReadonlyArray<ValidationDescriptor>
> {
  andThen<V extends T, W extends V>(
    validation: ValidationBuilder<V, U & W>
  ): ValidationBuilder<T, U & W> {
    return new ChainBuilder(
      "pipe",
      this.factory,
      [...this.options, build(validation) as ValidationDescriptor],
      this.contexts
    );
  }
}

class OnBuilder<T, U extends T, Options> extends BaseValidationBuilder<
  T,
  U,
  Options
> {
  constructor(
    name: string,
    factory: KnownValidatorFactory<T, U, Options>,
    options: Options,
    contexts: ReadonlyArray<string>
  ) {
    assert(
      !!contexts.length,
      "You must provide at least one validation context"
    );
    super(name, factory, options, contexts);
  }

  on(...contexts: string[]): BaseValidationBuilder<T, U, Options> {
    return new OnBuilder<T, U, Options>(
      this.name,
      this.factory,
      this.options,
      contexts
    );
  }
}
