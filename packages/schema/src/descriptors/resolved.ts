import { Dict, unknown } from "ts-std";
import { Type } from "../type";

export type Factory<D extends Descriptor> = (desc: D) => Type;
export interface ClassFactory<D extends Descriptor> {
  new(descriptor: D): Type;
}

export function factory<D extends Descriptor>(
  Class: ClassFactory<D>
): Factory<D> {
  return (descriptor: D) => new Class(descriptor);
}

export type Args = {} | null | undefined;

export interface ResolvedDescriptor {
  readonly type: keyof Descriptors;
}

export interface ResolvedDescriptorWithArgs<A extends Args = Args> extends ResolvedDescriptor {
  readonly args: A;
}

export function isResolvedDescriptor<K extends keyof Descriptors>(
  desc: Descriptor,
  type: K
): desc is Descriptors[K] {
  return desc.type === type;
}

export type MatchDelegate = {
  [P in keyof Descriptors]: (desc: Descriptors[P]) => unknown
};

export function matchDescriptor<M extends MatchDelegate, D extends Descriptor>(
  desc: D,
  callbacks: M
): ReturnType<M[D["type"]]> {
  if (isResolvedDescriptor(desc, "Optionality")) {
    return callbacks.Optionality(desc) as ReturnType<M["Optionality"]>;
  }

  if (isResolvedDescriptor(desc, "List")) {
    return callbacks.List(desc) as ReturnType<M["List"]>;
  }

  if (isResolvedDescriptor(desc, "Pointer")) {
    return callbacks.Pointer(desc) as ReturnType<M["Pointer"]>;
  }

  if (isResolvedDescriptor(desc, "Iterator")) {
    return callbacks.Iterator(desc) as ReturnType<M["Iterator"]>;
  }

  if (isResolvedDescriptor(desc, "Dictionary")) {
    return callbacks.Dictionary(desc) as ReturnType<M["Dictionary"]>;
  }

  if (isResolvedDescriptor(desc, "Primitive")) {
    return callbacks.Primitive(desc) as ReturnType<M["Primitive"]>;
  }

  throw new Error("unreachable");
}

export function isResolvedGenericDescriptor(
  desc: ResolvedDescriptor
): desc is List | Pointer | Iterator {
  switch (desc.type) {
    case "Iterator":
    case "Pointer":
    case "List":
      return true;
    default:
      return false;
  }
}

export interface OptionalityArgs {
  isOptional: boolean;
}

export interface Optionality extends ResolvedDescriptorWithArgs<OptionalityArgs> {
  readonly type: "Optionality";
  readonly args: OptionalityArgs;
  readonly inner: Descriptor;
}

export interface ListArgs {
  readonly allowEmpty: boolean;
}

export interface List<A extends ListArgs = ListArgs> extends ResolvedDescriptorWithArgs<A> {
  readonly type: "List";
  readonly inner: Descriptor;
  readonly args: A;
}
export interface Pointer extends ResolvedDescriptor {
  readonly type: "Pointer";
  readonly inner: Descriptor;
}

export interface Iterator extends ResolvedDescriptor {
  readonly type: "Iterator";
  readonly inner: Descriptor;
}

export interface Dictionary extends ResolvedDescriptor {
  readonly type: "Dictionary";
  readonly members: Dict<Descriptor>;
}

export interface Primitive<A extends Args = Args> extends ResolvedDescriptorWithArgs<A> {
  readonly type: "Primitive";
  readonly args: A;
}

export interface Descriptors {
  Optionality: Optionality;
  List: List;
  Pointer: Pointer;
  Iterator: Iterator;
  Dictionary: Dictionary;
  Primitive: Primitive;
}

export type DescriptorType = keyof Descriptors;
export type Descriptor = Descriptors[DescriptorType];
export type ContainerDescriptor = List | Pointer | Iterator | Optionality;

export function instantiate(descriptor: Descriptor): Type {
  // @ts-ignore
  return descriptor.instantiate(descriptor);
}

// Is a concrete type (not a wrapper type like Required or Alias)
// and has an `inner` type
export type Collection = List | Pointer | Iterator;
