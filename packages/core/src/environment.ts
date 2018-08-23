import { Option } from "ts-std";

/**
 * @api host
 *
 * An object that provides host-specific behavior for validators. It is passed in to
 * all `ValidatorFactory`s, so hosts can also extend Environment to communicate with
 * validators written to be used in that environment.
 */
export interface Environment {
  get(object: unknown, key: string | number): unknown;
  asArray(object: unknown): Option<Iterator<unknown>>;
}
