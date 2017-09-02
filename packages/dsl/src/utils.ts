export type Maybe<T> = T | undefined;

export type Nested<T> = T | NestedArray<T>;
export interface NestedArray<T> extends Array<Nested<T>> {}

export function *flatten<T>(nested: Nested<T>): Iterable<T> {
  if (Array.isArray(nested)) {
    for (let item of nested) {
      yield *flatten(item);
    }
  } else {
    yield nested;
  }
}
