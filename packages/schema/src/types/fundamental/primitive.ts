import * as type from "../../type";
import { JSONValue } from "../../utils";

export type Args = JSONValue | undefined;

export interface PrimitiveClass {
  // this is `any` because we have no way of propagating the Args
  // through serialization anyway, and because of that, trying to
  // enforce the args through the type system doesn't work.
  new (desc: any): type.Type;
  buildArgs?(args: Args, required: boolean): Args;
}
