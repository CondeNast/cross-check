import { unknown } from "ts-std";
import { unresolved } from "../../descriptors";
import { exhausted } from "../../utils";
import { TypeBuilder } from "../fundamental";
import {
  Accumulator,
  DictionaryPosition,
  Pos,
  Reporter,
  genericPosition
} from "./reporter";

export interface VisitorDelegate {
  alias(type: unresolved.Alias, position: Pos): unknown;
  generic(type: unresolved.Container, position: Pos): unknown;
  dictionary(type: unresolved.Dictionary, position: Pos): unknown;
  record(type: unresolved.Record, position: Pos): unknown;
  primitive(
    type: unresolved.Primitive | unresolved.Refined,
    position: Pos
  ): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(descriptor: unresolved.Descriptor, position: Pos): unknown {
    // switch (descriptor.type) {
    //   case "Generic":
    //     throw new Error("Unimplemented visitor for generic");
    //   case "Alias":

    //   default:
    //     return exhausted(descriptor);
    // }

    if (unresolved.is(descriptor, "Alias")) {
      return this.delegate.alias(descriptor, position);
    } else if (
      unresolved.is(descriptor, "Pointer") ||
      unresolved.is(descriptor, "Iterator") ||
      unresolved.is(descriptor, "List")
    ) {
      return this.delegate.generic(descriptor, position);
    } else if (unresolved.is(descriptor, "Dictionary")) {
      return this.delegate.dictionary(descriptor, position);
    } else if (unresolved.is(descriptor, "Record")) {
      let desc = new TypeBuilder(descriptor).named(descriptor.name)
        .descriptor as unresolved.Alias;

      return this.delegate.alias(desc, position);
    } else if (unresolved.is(descriptor, "Primitive")) {
      return this.delegate.primitive(descriptor, position);
    } else if (unresolved.is(descriptor, "Refined")) {
      return this.delegate.primitive(descriptor, position);
    } else if (unresolved.is(descriptor, "Generic")) {
      throw new Error("Unimplemented visitor for Generic");
    } else {
      return exhausted(descriptor);
    }
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
  alias(descriptor: unresolved.Alias, pos: Pos): T["alias"];
  primitive(descriptor: unresolved.Primitive, pos: Pos): T["primitive"];
  generic(
    of: DelegateItem<T>,
    descriptor: unresolved.Container,
    pos: Pos
  ): T["generic"];
  dictionary(descriptor: unresolved.Dictionary, pos: Pos): T["dictionary"];
  record(descriptor: unresolved.Record, pos: Pos): T["record"];
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

  private constructor(private recursiveDelegate: RecursiveDelegate<T>) {}

  alias(descriptor: unresolved.Alias, pos: Pos): unknown {
    return this.recursiveDelegate.alias(descriptor, pos);
  }

  primitive(descriptor: unresolved.Primitive, pos: Pos): unknown {
    return this.recursiveDelegate.primitive(descriptor, pos);
  }

  generic(descriptor: unresolved.Container, pos: Pos): unknown {
    let genericPos = genericPosition(descriptor.type);

    return this.recursiveDelegate.generic(
      this.visitor.visit(descriptor.inner, genericPos),
      descriptor,
      pos
    );
  }

  record(descriptor: unresolved.Record, pos: Pos): unknown {
    return this.recursiveDelegate.record(descriptor, pos);
  }

  dictionary(descriptor: unresolved.Dictionary, pos: Pos): unknown {
    return this.recursiveDelegate.dictionary(descriptor, pos);
  }

  processDictionary(
    descriptor: unresolved.Dictionary | unresolved.Record,
    callback: (item: DelegateItem<T>, key: string, position: Pos) => void
  ): unknown {
    let input = descriptor.members;
    let meta = descriptor.membersMeta;
    let keys = Object.keys(input);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let dictPosition = DictionaryPosition({
        index: i,
        last,
        meta: meta[key]!
      });
      callback(
        this.visitor.visit(input[key]!, dictPosition),
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

  private constructor(private reporter: Reporter<Buffer, Inner, Options>) {}

  alias(descriptor: unresolved.Alias, position: Pos): unknown {
    this.reporter.startAlias(position, descriptor);
    this.reporter.endAlias(position, descriptor);
  }

  generic(descriptor: unresolved.Container, position: Pos): unknown {
    this.reporter.startGenericValue(position, descriptor);
    let pos = genericPosition(descriptor.type);
    this.visitor.visit(descriptor.inner, pos);
    this.reporter.endGenericValue(position, descriptor);
  }

  dictionary(descriptor: unresolved.Dictionary, position: Pos): void {
    this.reporter.startDictionary(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endDictionary(position, descriptor);
  }

  record(descriptor: unresolved.Record, position: Pos): Inner {
    this.reporter.startRecord(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endRecord(position, descriptor);

    return this.reporter.finish();
  }

  primitive(descriptor: unresolved.Primitive, position: Pos): unknown {
    this.reporter.primitiveValue(position, descriptor);
  }

  dictionaryBody(descriptor: unresolved.Dictionary | unresolved.Record) {
    let members = descriptor.members;
    let meta = descriptor.membersMeta;
    let keys = Object.keys(members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let position = DictionaryPosition({
        index: i,
        last,
        meta: meta[key]!
      });

      this.reporter.addKey(position, key, members[key]!);
      this.visitor.visit(members[key]!, position);
      this.reporter.endValue(position, members[key]!);
    });
  }
}
