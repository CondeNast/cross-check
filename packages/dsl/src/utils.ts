export type Option<T> = T | null;

export type Opaque = {} | void | null | undefined;

export type Nested<T> = T | NestedArray<T>;
export interface NestedArray<T> extends Array<Nested<T>> {};

export function *flatten<T>(nested: Nested<T>): Iterable<T> {
  if (Array.isArray(nested)) {
    for (let item of nested) {
      yield *flatten(item);
    }
  } else {
    yield nested;
  }
}

class AssertionFailed extends Error {
  constructor(message?: string) {
    super(message ? `Assertion failed: ${message}` : 'Assertion failed.');
  }
}

/* TODO: use babel-plugin-debug-macros */
export function assert(cond: any, message?: string) {
  if (!cond) throw new AssertionFailed(message);
}
