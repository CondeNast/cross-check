import { Dict, JSONObject, Option, dict, entries } from "ts-std";
import { Type, TypeBuilder } from "../type";
import { JSONValue } from "../utils";
import * as resolved from "./resolved";

export type Args = {} | null | undefined;
export type BuildArgs<A extends Args> = A | ((args: A, required: boolean) => A);

export interface Factory<D extends Descriptor> {
  new (descriptor: D): resolved.Descriptor;
}

// tslint:disable-next-line:interface-name
export interface IDescriptor<A extends Args = Args> {
  readonly type: keyof Descriptors;
  readonly metadata: Option<JSONValue>;
  readonly args: A;
  readonly buildArgs?: BuildArgs<A>;
  readonly description: string;
  readonly instantiate: (
    descriptor: this,
    required: boolean
  ) => resolved.Descriptor;
}

export function buildArgs<A extends Args>(
  desc: { args: A; buildArgs?: BuildArgs<A> },
  required: boolean
): A {
  if (typeof desc.buildArgs === "function") {
    return desc.buildArgs(desc.args, required);
  } else {
    return desc.args;
  }
}

export interface ListArgs extends JSONObject {
  readonly allowEmpty: boolean;
}

export interface List<A extends ListArgs = ListArgs> extends IDescriptor<A> {
  readonly type: "List";
  readonly metadata: null;
  readonly inner: Descriptor;
}

export function List(
  inner: Descriptor,
  impl: resolved.Factory<resolved.List>,
  args: ListArgs = { allowEmpty: false }
): List {
  return {
    type: "List",
    description: "list",
    metadata: null,
    inner,
    args,
    instantiate: (desc, required) => instantiateList(desc, required, impl)
  };
}

function instantiateList(
  desc: List,
  required: boolean,
  impl: resolved.Factory<resolved.List>
): resolved.List {
  let args = buildArgs<ListArgs>(desc, true);

  if (required === false) {
    args = { ...args, allowEmpty: true };
  }

  return resolved.List(resolve(desc.inner, true), args, impl);
}

export interface Pointer<A extends JSONValue = JSONValue>
  extends IDescriptor<A> {
  readonly type: "Pointer";
  readonly name: string;
  readonly metadata: Option<JSONObject>;
  readonly inner: Descriptor;
}

export function Pointer<A extends JSONValue>({
  name,
  metadata,
  inner,
  args,
  impl
}: {
  name: string;
  metadata: Option<JSONObject>;
  inner: Descriptor;
  args: A;
  impl: resolved.Factory<resolved.Pointer>;
}): Pointer {
  return {
    type: "Pointer",
    name,
    description: "pointer",
    metadata,
    inner,
    args,
    instantiate: desc =>
      resolved.Pointer(resolve(desc.inner, true), buildArgs(desc, true), impl)
  };
}

export interface Iterator<A extends JSONValue = JSONValue>
  extends IDescriptor<A> {
  readonly type: "Iterator";
  readonly name: string;
  readonly metadata: Option<JSONObject>;
  readonly inner: Descriptor;
}

export function Iterator<A extends JSONValue>({
  name,
  metadata,
  inner,
  args,
  impl
}: {
  name: string;
  metadata: Option<JSONObject>;
  inner: Descriptor;
  args: A;
  impl: resolved.Factory<resolved.Iterator>;
}): Iterator {
  return {
    type: "Iterator",
    name,
    description: "iterator",
    metadata,
    inner,
    args,
    instantiate: desc =>
      resolved.Iterator(resolve(desc.inner, true), buildArgs(desc, true), impl)
  };
}

export interface MembersMeta extends JSONObject {
  [key: string]: JSONValue | undefined;
  features?: string[];
  required: boolean;
}

export type AnyDict = Record | Dictionary;

export interface Record<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Record";
  readonly members: Dict<Member>;
  readonly metadata: Option<JSONObject>;
  readonly name: string;
}

export interface Member {
  descriptor: Descriptor;
  meta: MembersMeta;
}

export interface DictionaryOptions {
  members: Dict<Member>;
  name?: string;
  impl: resolved.Factory<resolved.Dictionary>;
  OptionalityType: resolved.Factory<resolved.Optionality>;
}

export interface RecordOptions<A extends Args> {
  members: Dict<Member>;
  metadata: Option<JSONObject>;
  impl: resolved.Factory<resolved.Dictionary>;
  name: string;
  args: A;
  OptionalityType: resolved.Factory<resolved.Optionality>;
}

export function Record<A extends Args>({
  members,
  metadata,
  name,
  impl,
  args,
  OptionalityType
}: RecordOptions<A>): Record {
  return {
    type: "Record",
    members,
    metadata,
    description: "record",
    args,
    name,
    instantiate: resolveDictionary(impl, OptionalityType)
  };
}

export interface Dictionary<A extends JSONValue = JSONValue>
  extends IDescriptor<A> {
  readonly type: "Dictionary";
  readonly members: Dict<Member>;
  readonly metadata: null;
  readonly name: Option<string>;
}

export function Dictionary({
  members,
  impl,
  name,
  OptionalityType
}: DictionaryOptions): Dictionary {
  return {
    type: "Dictionary",
    members,
    metadata: null,
    description: "dictionary",
    args: null,
    name: name || null,
    instantiate: resolveDictionary(impl, OptionalityType)
  };
}

export function resolveDictionary<D extends Dictionary | Record>(
  impl: resolved.Factory<resolved.Dictionary>,
  OptionalityType: resolved.Factory<resolved.Optionality>
): (desc: D) => resolved.Dictionary {
  return (desc: D) => {
    let resolvedMembers = dict<resolved.Descriptor>();

    for (let [key, value] of entries(desc.members)) {
      let { required } = value!.meta;

      let inner = resolve(value!.descriptor, required !== false);
      inner = resolved.Optionality(inner, required === false, OptionalityType);

      resolvedMembers[key] = inner;
    }

    return resolved.Dictionary(resolvedMembers, impl);
  };
}

export type Base<A extends Args> = (desc: Refined<A>) => Primitive;

export interface Refined<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Refined";
  readonly name: string;
  readonly typescript: string;
  readonly metadata: null;
  readonly buildArgs: (args: A, required: boolean) => A;
  readonly base: Base<A>;
}

export function Refined<A extends Args>(
  Class: PrimitiveClass<A | undefined>,
  base: Base<A | undefined>,
  args?: A
): Refined;
export function Refined<A extends Args>(
  Class: PrimitiveClass<A>,
  base: Base<A>,
  args: A
): Refined;

export function Refined<A extends Args>(
  Class: PrimitiveClass<A>,
  base: Base<A>,
  args: A
): Refined<A> {
  return {
    type: "Refined",
    name: Class.typeName,
    typescript: Class.typescript,
    description: Class.description,
    args,
    buildArgs: Class.buildArgs ? Class.buildArgs : a => a,
    base,
    metadata: null,
    instantiate: (desc, required) =>
      resolved.Primitive(desc.buildArgs(args, required), Class)
  };
}

export interface Primitive<A extends Args = Args> extends IDescriptor<A> {
  readonly type: "Primitive";
  readonly name: string;
  readonly typescript: string;
  readonly metadata: null;
  readonly buildArgs: (args: A, required: boolean) => A;
}

export interface PrimitiveClass<A extends Args> {
  typescript: string;
  description: string;
  typeName: string;
  new (desc: resolved.Primitive<A>): Type;
  buildArgs?(desc: A, required: boolean): A;
}

export interface RefinedClass<A extends Args> extends PrimitiveClass<A> {
  base: (options?: A) => TypeBuilder<Primitive>;
}

export function Primitive<A extends Args>(
  Class: PrimitiveClass<A | undefined>,
  args?: A
): Primitive;
export function Primitive<A extends Args>(
  Class: PrimitiveClass<A>,
  args: A
): Primitive;

export function Primitive<A extends Args>(
  Class: PrimitiveClass<A>,
  args: A
): Primitive<A> {
  return {
    type: "Primitive",
    name: Class.typeName,
    typescript: Class.typescript,
    description: Class.description,
    args,
    buildArgs: Class.buildArgs ? Class.buildArgs : a => a,
    metadata: null,
    instantiate: (desc, required) =>
      resolved.Primitive(desc.buildArgs(desc.args, required), Class)
  };
}

export interface Alias extends IDescriptor<undefined> {
  readonly type: "Alias";
  readonly name: string;
  readonly metadata: null;
  readonly args: undefined;
  readonly inner: Descriptor;
}

export function Alias(inner: Descriptor, name: string): Alias {
  return {
    type: "Alias",
    description: "alias",
    name,
    metadata: null,
    args: undefined,
    inner,
    instantiate: (desc, required) => resolve(desc.inner, required)
  };
}

export interface RequiredOptions extends JSONObject {
  required: boolean;
}

export interface Generic<G = {} | void | undefined> extends IDescriptor<G> {
  readonly name: string;
  readonly args: G;
}

export function Generic<G>(
  name: string,
  args: G,
  apply: (desc: Generic<G>) => resolved.Descriptor
): Generic<G> {
  return {
    type: "Generic",
    name,
    metadata: null,
    args,
    description: "generic",
    instantiate(desc: Generic<G>): resolved.Descriptor {
      return apply(desc);
    }
  };
}

export interface ResolveDelegate {
  resolve(name: string): IDescriptor;
}

export interface Descriptors {
  List: List;
  Pointer: Pointer;
  Iterator: Iterator;
  Record: Record;
  Dictionary: Dictionary;
  Primitive: Primitive;
  Refined: Refined;
  Alias: Alias;
  Generic: Generic;
}

export type Descriptor = Descriptors[keyof Descriptors];
export type Resolved<D extends Descriptor> = ReturnType<D["instantiate"]>;

export function resolve<D extends Descriptor>(
  descriptor: D,
  isRequired: boolean
): resolved.Descriptor {
  // @ts-ignore
  return descriptor.instantiate(descriptor, isRequired);
}

export function instantiate<D extends Descriptor>(
  descriptor: D,
  isRequired: boolean
): Type {
  let r = resolve(descriptor, isRequired);
  return resolved.instantiate(r);
}

export type Container = Pointer | Iterator | List;

export function is<K extends keyof Descriptors>(
  desc: Descriptor,
  type: K
): desc is Descriptors[K] {
  return desc.type === type;
}

export function isContainer(value: Descriptor): value is Container {
  switch (value.type) {
    case "Pointer":
    case "Iterator":
    case "List":
      return true;
    default:
      return false;
  }
}
