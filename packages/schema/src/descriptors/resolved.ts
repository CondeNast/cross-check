import { Dict, unknown } from "ts-std";
import { Type } from "../type";
import { JSONValue } from "../utils";

export interface Factory<D extends Descriptor> {
  new (desc: D): Type;
}

export type Args = {} | null | undefined;

// tslint:disable-next-line:interface-name
export interface IDescriptor<A extends Args = Args> {
  readonly type: keyof Descriptors;
  readonly args: A;

  instantiate(desc: this): Type;
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
  desc: IDescriptor
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

export interface Optionality extends IDescriptor<OptionalityArgs> {
  readonly type: "Optionality";
  readonly args: OptionalityArgs;
  readonly inner: Descriptor;
}

export function Optionality(
  inner: Descriptor,
  isOptional: boolean,
  Instance: { new (desc: Optionality): Type }
): Optionality {
  return {
    type: "Optionality",
    args: { isOptional },
    inner,
    instantiate: (desc: Optionality) => new Instance(desc)
  } as Optionality;
}

export interface ListArgs {
  readonly allowEmpty: boolean;
}

export interface List<A extends ListArgs = ListArgs> extends IDescriptor<A> {
  readonly type: "List";
  readonly inner: Descriptor;
  readonly args: A;
}

export function List<A extends ListArgs>(
  inner: Descriptor,
  args: A,
  impl: Factory<List>
): List {
  return {
    type: "List",
    inner,
    args,
    instantiate: desc => new impl(desc)
  };
}

export interface Pointer<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Pointer";
  readonly inner: Descriptor;
  readonly args: A;
}

export function Pointer(
  inner: Descriptor,
  args: JSONValue,
  impl: Factory<Pointer>
): Pointer {
  return {
    type: "Pointer",
    inner,
    args,
    instantiate: desc => new impl(desc)
  };
}

export interface Iterator<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Iterator";
  readonly inner: Descriptor;
  readonly args: A;
}

export function Iterator<A extends Args = Args>(
  inner: Descriptor,
  args: A,
  impl: Factory<Iterator>
): Iterator {
  return {
    type: "Iterator",
    inner,
    args,
    instantiate: desc => new impl(desc)
  };
}

export interface Dictionary<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Dictionary";
  readonly members: Dict<Descriptor>;
}

export function Dictionary(
  members: Dict<Descriptor>,
  Class: { new (desc: Dictionary): Type }
): Dictionary {
  return {
    type: "Dictionary",
    members,
    args: null,
    instantiate: (desc: Dictionary) => new Class(desc)
  };
}

export interface Primitive<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Primitive";
  readonly args: A;
}

export function Primitive<A extends Args>(
  args: A,
  Class: { new (desc: Primitive<A>): Type }
): Primitive<A> {
  return {
    type: "Primitive",
    args,
    instantiate: desc => new Class(desc)
  };
}

export interface Descriptors {
  Optionality: Optionality;
  List: List;
  Pointer: Pointer;
  Iterator: Iterator;
  Dictionary: Dictionary;
  Primitive: Primitive;
}

export type Descriptor = Descriptors[keyof Descriptors];
export type ContainerDescriptor = List | Pointer | Iterator | Optionality;

export function instantiate(descriptor: Descriptor): Type {
  // @ts-ignore
  return descriptor.instantiate(descriptor);
}

// Is a concrete type (not a wrapper type like Required or Alias)
// and has an `inner` type
export type Collection = List | Pointer | Iterator;
