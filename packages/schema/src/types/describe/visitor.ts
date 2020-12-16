import { builders } from "../../descriptors";
import { visitorDescriptor } from "../../descriptors/dehydrated";
import { FormattableRecord } from "../../record";
import { Registry, RegistryName } from "../../registry";
import { JSONObject, JSONValue } from "../../utils";
import { ListArgs } from "../fundamental";
import {
  Accumulator,
  DictionaryPosition,
  Pos,
  Reporter,
  genericPosition
} from "./reporter";

export interface VisitorDelegate {
  alias(type: Alias, position: Pos): unknown;
  generic(type: ContainerDescriptor, position: Pos): unknown;
  dictionary(type: Dictionary, position: Pos): unknown;
  record(
    name: string,
    dictionary: Dictionary,
    metadata: JSONObject | null,
    position: Pos
  ): unknown;
  primitive(type: Primitive, position: Pos): unknown;
}

type Mapping<T> = T extends Alias
  ? VisitorDelegate["alias"]
  : [T] extends [Pointer | Iterator | List]
    ? VisitorDelegate["generic"]
    : T extends Dictionary
      ? VisitorDelegate["dictionary"]
      : T extends Record
        ? VisitorDelegate["record"]
        : T extends Primitive ? VisitorDelegate["primitive"] : never;

function target(
  descriptor: Descriptor,
  delegate: VisitorDelegate
): Mapping<typeof descriptor> {
  switch (descriptor.type) {
    case "Alias": {
      return delegate.alias;
    }

    case "List":
    case "Iterator":
    case "Pointer":
      return delegate.generic;

    case "Dictionary":
      return delegate.dictionary;

    case "Record":
      return delegate.record;

    case "Primitive":
      return delegate.primitive;
  }
}

export interface VisitorDescriptors {
  alias: Alias;
  generic: ContainerDescriptor;
  dictionary: Dictionary;
  record: Record;
  primitive: Primitive;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(descriptor: Descriptor, pos: Pos): unknown {
    let t = target(descriptor, this.delegate) as Mapping<typeof descriptor>;
    // @ts-ignore
    return t.call(this.delegate, descriptor, pos);
  }
}

export interface RecursiveDelegateTypes {
  primitive: unknown;
  generic: unknown;
  dictionary: unknown;
  alias: unknown;
  record: unknown;
}

export type DelegateItem<T extends RecursiveDelegateTypes> =
  | T["primitive"]
  | T["generic"]
  | T["alias"]
  | T["dictionary"];

export interface Primitive {
  type: "Primitive";
  args: JSONValue | undefined;
  name: string;

  // metadata
  description: string;
  typescript: string;
  required: boolean;
}

export interface Alias {
  type: "Alias";
  target: RegistryName | "Record";
  name: string;
  required: boolean;
}

export interface Pointer {
  type: "Pointer";
  inner: Alias;
  metadata: JSONObject | null;
  required: boolean;

  // Compatibility with the previous descriptor model
  name: string;
}

export interface Iterator {
  type: "Iterator";
  inner: Alias;
  metadata: JSONObject | null;
  required: boolean;

  // Compatibility with the previous descriptor model
  name: string;
}

export interface List {
  type: "List";
  inner: Descriptor;
  args: ListArgs;
  required: boolean;
}

export type ContainerDescriptor = Pointer | Iterator | List;

export interface Member {
  descriptor: Descriptor;
  meta?: builders.MembersMeta;
}

export interface Dictionary {
  type: "Dictionary";
  members: { [key: string]: Member };
  required: boolean;
}

export interface Record {
  type: "Record";
  name: string;
  members: { [key: string]: Member };
  metadata: JSONObject | null;
  required: boolean;
}

export type Container = Pointer | Iterator | List;

export interface Descriptors {
  Primitive: Primitive;
  Alias: Alias;
  Pointer: Pointer;
  Iterator: Iterator;
  List: List;
  Dictionary: Dictionary;
  Record: Record;
}

export type Descriptor = Descriptors[keyof Descriptors];

/**
 * The `RecursiveDelegate` interface receives recursive events for the tree
 * of schema elements, passing the return value of child types into the
 * events for container types.
 *
 * For example, if you have this type:
 *
 * ```ts
 * Record("person", {
 *   name: SingleLineString(),
 *   phoneNumber: List(SingleWordString())
 * })
 * ```
 *
 * In the `record` event, you should call `this.visitor.processDictionary(record, callback)`,
 * which will invoke the following events in this order:
 *
 * 1. `primitive(desc)` (`desc` is a descriptor for SingleLineString in name)
 *   a. the `processDictionary` callback will be called with `name` and the return
 *      value of _1_
 * 2. `primitive(desc)` (`desc` is a descriptor for SingleLineString in phoneNumber)
 *   a. `generic(of, desc)` will be called with the return value of _2_ and the descriptor
 *      for `List`
 *     i. the `processDictionary` callback will be called with `phoneNumber` and
 *        the return value of `2.a`
 */
export interface RecursiveDelegate<
  T extends RecursiveDelegateTypes = RecursiveDelegateTypes
> {
  alias(descriptor: Alias, pos: Pos): T["alias"];
  primitive(descriptor: Primitive, pos: Pos): T["primitive"];
  generic(
    of: DelegateItem<T>,
    descriptor: ContainerDescriptor,
    pos: Pos
  ): T["generic"];
  dictionary(descriptor: Dictionary, pos: Pos): T["dictionary"];
  record(descriptor: Record, pos: Pos): T["record"];
}

export function recursive<T extends RecursiveDelegateTypes>(Class: {
  new (): RecursiveDelegate<T>;
}): (record: FormattableRecord, registry: Registry) => T["record"] {
  return (record: FormattableRecord, registry: Registry) => {
    return RecursiveVisitor.visit<T>(new Class(), record, registry);
  };
}

export class RecursiveVisitor<T extends RecursiveDelegateTypes>
  implements VisitorDelegate {
  static visit<T extends RecursiveDelegateTypes>(
    delegate: RecursiveDelegate<T>,
    record: FormattableRecord,
    registry: Registry
  ): T["record"] {
    let recursiveVisitor = new RecursiveVisitor<T>(delegate);
    let v = new Visitor(recursiveVisitor);
    recursiveVisitor.visitor = v;
    return recursiveVisitor.record(
      record.name,
      visitorDescriptor(record.members, registry),
      record.metadata,
      Pos.Only
    );
  }

  static build<T extends RecursiveDelegateTypes>(
    delegate: RecursiveDelegate<T>
  ): RecursiveVisitor<T> {
    let recursiveVisitor = new RecursiveVisitor<T>(delegate);
    let v = new Visitor(recursiveVisitor);
    recursiveVisitor.visitor = v;
    return recursiveVisitor;
  }

  private visitor!: Visitor;

  private constructor(private recursiveDelegate: RecursiveDelegate<T>) {}

  alias(descriptor: Alias, pos: Pos): unknown {
    return this.recursiveDelegate.alias(descriptor, pos);
  }

  primitive(descriptor: Primitive, pos: Pos): unknown {
    return this.recursiveDelegate.primitive(descriptor, pos);
  }

  generic(descriptor: ContainerDescriptor, pos: Pos): unknown {
    let genericPos = genericPosition(descriptor.type, descriptor.inner);

    return this.recursiveDelegate.generic(
      this.visitor.visit(descriptor.inner, genericPos),
      descriptor,
      pos
    );
  }

  record(
    name: string,
    dictionary: Dictionary,
    metadata: JSONObject | null,
    pos: Pos
  ): ReturnType<RecursiveDelegate<T>["record"]> {
    let descriptor = recordDescriptor(name, dictionary, metadata);
    return this.recursiveDelegate.record(descriptor, pos);
  }

  dictionary(descriptor: Dictionary, pos: Pos): unknown {
    return this.recursiveDelegate.dictionary(descriptor, pos);
  }

  processDictionary(
    descriptor: Dictionary | Record,
    callback: (item: DelegateItem<T>, key: string, position: Pos) => void
  ): void {
    let input = descriptor.members;
    let keys = Object.keys(input);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let dictPosition = DictionaryPosition({
        index: i,
        last,
        descriptor: input[key]!.descriptor
      });
      callback(
        this.visitor.visit(input[key]!.descriptor, dictPosition),
        key,
        dictPosition
      );
    });
  }
}

export class StringVisitor<Buffer extends Accumulator<Inner>, Inner, Options>
  implements VisitorDelegate {
  static build<Buffer extends Accumulator<Inner>, Inner, Options>(
    reporter: Reporter<Buffer, Inner, Options>
  ): StringVisitor<Buffer, Inner, Options> {
    let stringVisitor = new StringVisitor(reporter);
    let v = new Visitor(stringVisitor);
    stringVisitor.visitor = v;
    return stringVisitor;
  }

  private visitor!: Visitor;

  private constructor(private reporter: Reporter<Buffer, Inner, Options>) {}

  alias(descriptor: Alias, position: Pos): void {
    this.reporter.startAlias(position, descriptor);
    this.reporter.endAlias(position, descriptor);
  }

  generic(descriptor: Container, position: Pos): void {
    this.reporter.startGenericValue(position, descriptor);
    let pos = genericPosition(descriptor.type, descriptor.inner);
    this.visitor.visit(descriptor.inner, pos);
    this.reporter.endGenericValue(position, descriptor);
  }

  dictionary(descriptor: Dictionary, position: Pos): void {
    this.reporter.startDictionary(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endDictionary(position, descriptor);
  }

  record(
    name: string,
    dictionary: Dictionary,
    metadata: JSONObject | null,
    position: Pos
  ): Inner {
    let descriptor = recordDescriptor(name, dictionary, metadata);

    this.reporter.startRecord(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endRecord(position, descriptor);

    return this.reporter.finish();
  }

  primitive(descriptor: Primitive, position: Pos): void {
    this.reporter.primitiveValue(position, descriptor);
  }

  dictionaryBody(descriptor: Dictionary | Record) {
    let members = descriptor.members;
    let keys = Object.keys(members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let position = DictionaryPosition({
        index: i,
        last,
        descriptor: members[key]!.descriptor
      });

      this.reporter.addKey(position, key, members[key]!.descriptor);
      this.visitor.visit(members[key]!.descriptor, position);
      this.reporter.endValue(position, members[key]!.descriptor);
    });
  }
}

function recordDescriptor(
  name: string,
  dictionary: Dictionary,
  metadata: JSONObject | null
): Record {
  return {
    type: "Record",
    name,
    members: dictionary.members,
    metadata,
    required: true
  };
}
