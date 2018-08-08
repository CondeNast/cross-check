import { registered, resolved } from "../../descriptors";
import * as type from "../../type";
import { JSONValue } from "../../utils";

export function Primitive(
  Class: SimplePrimitiveClass
): registered.Primitive {
  return new registered.Primitive(PrimitiveState(Class));
}

export function PrimitiveWithOptions<Args extends JSONValue | undefined>(
  Class: BuildablePrimitiveClass<Args>,
  options: Args
): registered.Primitive {
  return new registered.Primitive(PrimitiveState(Class, options));
}

export interface PrimitiveClass<Args extends JSONValue | undefined = JSONValue | undefined> {
  typescript: string;
  description: string;
  typeName: string;
  new(desc: Args): type.Primitive;
}

export interface SimplePrimitiveClass extends PrimitiveClass<undefined> {
}

export interface BuildablePrimitiveClass<Args extends JSONValue | undefined> extends PrimitiveClass<Args> {
  typescript: string;
  description: string;
  typeName: string;
  new(descriptor: resolved.Primitive<Args>): type.Primitive;
  buildArgs?(args: Args, required: boolean): Args;
}

export function PrimitiveState<Args extends JSONValue | undefined>(
  Class: PrimitiveClass<Args>,
  args?: Args
): registered.PrimitiveState {
  return {
    name: Class.typeName,
    typescript: Class.typescript,
    description: Class.description,
    args
  }
}
