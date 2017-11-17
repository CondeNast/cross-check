import { ValidationDescriptor, ValidatorFactory } from '@cross-check/core';
import { assert, unknown } from 'ts-std';
import { MapErrorTransform, ValidationDescriptors, and, chain, mapError, or } from './combinators';
import { descriptor } from './internal';
import { ValidationCallback, factoryForCallback } from './validators/callback';

/**
 * @api public
 * 
 * A validation that can be passed to one of the methods on ValidationBuilder.
 * 
 * It's either another ValidationBuilder or a callback, which allows a more inline
 * style of composing validation chains.
 */
export type Buildable<T> = ValidationCallback<T> | ValidationBuilder<T>;

/**
 * @api public
 * 
 * The main API for building validations. In general, always depend on this interface,
 * rather than concrete implementations of the interface.
 */
export interface ValidationBuilder<T> {
  /**
   * @api public
   * 
   * Run two validations. If at least one validation fails, the composed validation
   * fails. If both validations fail, the composed validation produces the errors
   * from both validations, concatenated together.
   * 
   * @param validation 
   */
  andAlso(validation: Buildable<T>): ValidationBuilder<T>;

  /**
   * @api public
   * 
   * Run a validation. If the validation fails, run the second validation. If both
   * validations succeed, the composed validation produces no errors. Otherwise, produce
   * a "multi" validation that includes the errors for any validation that failed.
   */
  or(validation: Buildable<T>): ValidationBuilder<T>;

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
  andThen<U extends T>(validation: Buildable<U>): ValidationBuilder<T>;

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
  catch(transform: MapErrorTransform): ValidationBuilder<T>;

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
  on(...contexts: string[]): ValidationBuilder<T>;

  /* @internal */
  build(): ValidationDescriptor<T>;
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
export function build<T>(buildable: Buildable<T>): ValidationDescriptor<T> {
  if (isCallback(buildable)) {
    return {
      factory: factoryForCallback,
      options: buildable,
      contexts: []
    };
  } else {
    return buildable.build();
  }
}

export function validates<T, Options>(factory: ValidatorFactory<T, Options>, options: Options): ValidationBuilder<T> {
  return new BaseValidationBuilder(factory, options);
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
export function extend<T>({ factory, options, contexts }: ValidationDescriptor<T, unknown>): ValidationBuilder<T> {
  if (contexts.length > 0) {
    return new OnBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else if (factory  === and) {
    return new AndBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else if (factory === or) {
    return new OrBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else if (factory === chain) {
    return new ChainBuilder(factory, options as ValidationDescriptors<T>, contexts);
  } else {
    return new BaseValidationBuilder(factory, options, contexts);
  }
}

function isCallback<T>(buildable: Buildable<T>): buildable is ValidationCallback<T> {
  return typeof buildable === 'function';
}

class BaseValidationBuilder<T, Options> implements ValidationBuilder<T> {
  constructor(protected factory: ValidatorFactory<T, Options>, protected options: Options, protected contexts: ReadonlyArray<string> = []) {
  }

  andAlso(validation: Buildable<T>): ValidationBuilder<T> {
    return new AndBuilder(and, [build(this), build(validation)], this.contexts);
  }

  or(validation: Buildable<T>): ValidationBuilder<T> {
    return new OrBuilder(or, [build(this), build(validation)], this.contexts);
  }

  andThen<U extends T>(validation: Buildable<U>): ValidationBuilder<T> {
    return new ChainBuilder(chain, [build(this), build(validation)], this.contexts);
  }

  catch(transform: MapErrorTransform): ValidationBuilder<T> {
    return new BaseValidationBuilder(mapError, { descriptor: build(this), transform }, this.contexts);
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    return new OnBuilder(this.factory, this.options, contexts);
  }

  build(): Readonly<{ factory: ValidatorFactory<T, unknown>; options: unknown; contexts: ReadonlyArray<string>; }> {
    return descriptor(this.factory, this.options, this.contexts);
  }
}

class AndBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  andAlso(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new AndBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class OrBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  or(validation: ValidationBuilder<T>): ValidationBuilder<T> {
    return new OrBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class ChainBuilder<T> extends BaseValidationBuilder<T, ReadonlyArray<ValidationDescriptor>> {
  andThen<U extends T>(validation: ValidationBuilder<U>): ValidationBuilder<T> {
    return new ChainBuilder(this.factory, [...this.options, build(validation)], this.contexts);
  }
}

class OnBuilder<T, Options> extends BaseValidationBuilder<T, Options> {
  constructor(factory: ValidatorFactory<T, Options>, options: Options, contexts: ReadonlyArray<string>) {
    assert(!!contexts.length, 'You must provide at least one validation context');
    super(factory, options, contexts);
  }

  on(...contexts: string[]): ValidationBuilder<T> {
    return new OnBuilder(this.factory, this.options, contexts);
  }
}
