import { unknown } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { exhausted } from "../../utils";
import { TypeBuilderImpl } from "../fundamental";
import {
  Accumulator,
  DictionaryPosition,
  Pos,
  Reporter,
  genericPosition
} from "./reporter";

export interface VisitorDelegate {
  alias(type: AliasDescriptor, position: Pos): unknown;
  generic(type: ContainerDescriptor, position: Pos): unknown;
  dictionary(type: DictionaryDescriptor, position: Pos): unknown;
  record(type: RecordDescriptor, position: Pos): unknown;
  primitive(type: PrimitiveDescriptor, position: Pos): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) { }

  visit(typeBuilder: builder.TypeBuilder, position: Pos): unknown {
    let delegate = this.delegate[typeBuilder.type];

    return delegate(typeBuilder, pos);

    //   if (builder.is(descriptor, "Alias")) {
    //     return this.delegate.alias(descriptor, position);
    //   } else if (
    //     builder.is(descriptor, "Pointer") ||
    //     builder.is(descriptor, "Iterator") ||
    //     builder.is(descriptor, "List")
    //   ) {
    //     return this.delegate.generic(descriptor, position);
    //   } else if (builder.is(descriptor, "Dictionary")) {
    //     return this.delegate.dictionary(descriptor, position);
    //   } else if (builder.is(descriptor, "Record")) {
    //     let desc = new TypeBuilderImpl(descriptor).named(descriptor.name)
    //       .descriptor as builder.Alias;

    //     return this.delegate.alias(desc, position);
    //   } else if (builder.is(descriptor, "Primitive")) {
    //     return this.delegate.primitive(descriptor, position);
    //   } else if (builder.is(descriptor, "Refined")) {
    //     return this.delegate.primitive(descriptor, position);
    //   } else if (builder.is(descriptor, "Generic")) {
    //     throw new Error("Unimplemented visitor for Generic");
    //   } else {
    //     return exhausted(descriptor);
    //   }
    // }
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

export interface PrimitiveDescriptor extends resolved.Primitive {
  name: string;
}

export interface AliasDescriptor {
  name: string;
}

export interface PointerDescriptor extends resolved.Pointer { }
export interface IteratorDescriptor extends resolved.Iterator { }
export interface ListDescriptor extends resolved.List { }
export type ContainerDescriptor = PointerDescriptor | IteratorDescriptor | ListDescriptor;

export interface DictionaryDescriptor extends resolved.Dictionary { }
export interface RecordDescriptor extends resolved.Dictionary { }

export type VisitorDescriptor = PrimitiveDescriptor | AliasDescriptor | PointerDescriptor | IteratorDescriptor | ListDescriptor | DictionaryDescriptor | RecordDescriptor;

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
  alias(descriptor: AliasDescriptor, pos: Pos): T["alias"];
  primitive(descriptor: PrimitiveDescriptor, pos: Pos): T["primitive"];
  generic(
    of: DelegateItem<T>,
    descriptor: ContainerDescriptor,
    pos: Pos
  ): T["generic"];
  dictionary(descriptor: DictionaryDescriptor, pos: Pos): T["dictionary"];
  record(descriptor: RecordDescriptor, pos: Pos): T["record"];
}

export class RecursiveVisitor<T extends RecursiveDelegateTypes>
  implements VisitorDelegate {
  static build<T extends RecursiveDelegateTypes>(
    delegate: RecursiveDelegate<T>
  ): RecursiveVisitor<T> {
    let recursiveVisitor = new RecursiveVisitor<T>(delegate);
    let visitor = new Visitor(recursiveVisitor);
    recursiveVisitor.visitor = visitor;
    return recursiveVisitor;
  }

  private visitor!: Visitor;

  private constructor(private recursiveDelegate: RecursiveDelegate<T>, registry: builder.Registry) { }

  alias(descriptor: AliasDescriptor, pos: Pos): unknown {
    return this.recursiveDelegate.alias(descriptor, pos);
  }

  primitive(descriptor: PrimitiveDescriptor, pos: Pos): unknown {
    return this.recursiveDelegate.primitive(descriptor, pos);
  }

  generic(descriptor: ContainerDescriptor, pos: Pos): unknown {
    let genericPos = genericPosition(descriptor.type);

    return this.recursiveDelegate.generic(
      this.visitor.visit(descriptor.inner, genericPos),
      descriptor,
      pos
    );
  }

  record(descriptor: RecordDescriptor, pos: Pos): unknown {
    return this.recursiveDelegate.record(descriptor, pos);
  }

  dictionary(descriptor: DictionaryDescriptor, pos: Pos): unknown {
    return this.recursiveDelegate.dictionary(descriptor, pos);
  }

  processDictionary(
    descriptor: DictionaryDescriptor | RecordDescriptor,
    callback: (item: DelegateItem<T>, key: string, position: Pos) => void
  ): unknown {
    let input = descriptor.members;
    let keys = Object.keys(input);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let dictPosition = DictionaryPosition({
        index: i,
        last,
        meta: input[key]!.meta
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
    let visitor = new Visitor(stringVisitor);
    stringVisitor.visitor = visitor;
    return stringVisitor;
  }

  private visitor!: Visitor;

  private constructor(private reporter: Reporter<Buffer, Inner, Options>) { }

  alias(descriptor: builder.Alias, position: Pos): unknown {
    this.reporter.startAlias(position, descriptor);
    this.reporter.endAlias(position, descriptor);
  }

  generic(descriptor: builder.Container, position: Pos): unknown {
    this.reporter.startGenericValue(position, descriptor);
    let pos = genericPosition(descriptor.type);
    this.visitor.visit(descriptor.inner, pos);
    this.reporter.endGenericValue(position, descriptor);
  }

  dictionary(descriptor: builder.Dictionary, position: Pos): void {
    this.reporter.startDictionary(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endDictionary(position, descriptor);
  }

  record(descriptor: builder.Record, position: Pos): Inner {
    this.reporter.startRecord(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endRecord(position, descriptor);

    return this.reporter.finish();
  }

  primitive(descriptor: builder.Primitive, position: Pos): unknown {
    this.reporter.primitiveValue(position, descriptor);
  }

  dictionaryBody(descriptor: builder.Dictionary | builder.Record) {
    let members = descriptor.members;
    let keys = Object.keys(members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let position = DictionaryPosition({
        index: i,
        last,
        meta: members[key]!.meta
      });

      this.reporter.addKey(position, key, members[key]!.descriptor);
      this.visitor.visit(members[key]!.descriptor, position);
      this.reporter.endValue(position, members[key]!.descriptor);
    });
  }
}
