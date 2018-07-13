import { unknown } from "ts-std";
import {
  AliasDescriptor,
  CollectionDescriptor,
  DictionaryDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  RequiredDescriptor,
  defaults
} from "../fundamental/descriptor";
import { Type } from "../fundamental/value";
import { exhausted } from "../utils";
import {
  Accumulator,
  DictionaryPosition,
  Pos,
  Reporter,
  genericPosition
} from "./reporter";

export interface VisitorDelegate {
  alias(type: AliasDescriptor, position: Pos): unknown;
  required(type: RequiredDescriptor, position: Pos): unknown;
  generic(type: CollectionDescriptor, position: Pos): unknown;
  dictionary(type: DictionaryDescriptor, position: Pos): unknown;
  record(type: RecordDescriptor, position: Pos): unknown;
  primitive(type: PrimitiveDescriptor, position: Pos): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(type: Type, position: Pos): unknown {
    let descriptor = type.descriptor;

    switch (descriptor.type) {
      case "Alias": {
        return this.delegate.alias(descriptor, position);
      }

      case "Required": {
        return this.delegate.required(descriptor, position);
      }

      case "Pointer":
      case "Iterator":
      case "List": {
        return this.delegate.generic(descriptor, position);
      }

      case "Dictionary": {
        return this.delegate.dictionary(descriptor, position);
      }

      case "Record": {
        let desc: AliasDescriptor = defaults("Alias", {
          name: descriptor.name,
          args: type,
          description: descriptor.description
        });

        return this.delegate.alias(desc, position);
      }

      case "Primitive": {
        return this.delegate.primitive(descriptor, position);
      }

      default:
        exhausted(descriptor);
    }
  }
}

export interface RecursiveDelegate {
  required?(descriptor: ItemType<this>): unknown;
  primitive(descriptor: PrimitiveDescriptor): unknown;
  generic(of: ItemType<this>, descriptor: CollectionDescriptor): unknown;
  alias(descriptor: AliasDescriptor): unknown;
  dictionary(descriptor: DictionaryDescriptor): unknown;
  record(descriptor: RecordDescriptor): unknown;
}

export type ItemType<D extends RecursiveDelegate> =
  | ReturnType<D["primitive"]>
  | ReturnType<D["generic"]>
  | ReturnType<D["dictionary"]>;

export class RecursiveVisitor<D extends RecursiveDelegate>
  implements VisitorDelegate {
  static build<D extends RecursiveDelegate>(delegate: D): RecursiveVisitor<D> {
    let recursiveVisitor = new RecursiveVisitor(delegate);
    let visitor = new Visitor(recursiveVisitor);
    recursiveVisitor.visitor = visitor;
    return recursiveVisitor;
  }

  private visitor!: Visitor;

  private constructor(private recursiveDelegate: D) {}

  alias(descriptor: AliasDescriptor): unknown {
    return this.recursiveDelegate.alias(descriptor);
  }

  required(descriptor: RequiredDescriptor): unknown {
    let inner = this.visitor.visit(descriptor.args.type, Pos.Only) as ItemType<
      D
    >;
    if (this.recursiveDelegate.required) {
      return this.recursiveDelegate.required(inner);
    } else {
      return inner;
    }
  }

  primitive(descriptor: PrimitiveDescriptor): unknown {
    return this.recursiveDelegate.primitive(descriptor);
  }

  generic(descriptor: CollectionDescriptor): unknown {
    let position = genericPosition(descriptor.type);

    return this.recursiveDelegate.generic(
      this.visitor.visit(descriptor.args, position) as ItemType<D>,
      descriptor
    );
  }

  record(descriptor: RecordDescriptor): unknown {
    return this.recursiveDelegate.record(descriptor);
  }

  dictionary(descriptor: DictionaryDescriptor): unknown {
    return this.recursiveDelegate.dictionary(descriptor);
  }

  processDictionary(
    descriptor: DictionaryDescriptor | RecordDescriptor,
    callback: (item: ItemType<D>, key: string) => void
  ): unknown {
    let input = descriptor.args;
    let keys = Object.keys(input);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let dictPosition = DictionaryPosition({ index: i, last });

      callback(
        this.visitor.visit(input[key]!, dictPosition) as ItemType<D>,
        key
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

  alias(descriptor: AliasDescriptor, position: Pos): unknown {
    this.reporter.startAlias(position, descriptor);
    this.reporter.endAlias(position, descriptor);
  }

  required(descriptor: RequiredDescriptor, position: Pos): unknown {
    this.reporter.startRequired(position, descriptor);
    this.visitor.visit(descriptor.args.type, position);
    this.reporter.endRequired(position, descriptor);
  }

  generic(descriptor: CollectionDescriptor, position: Pos): unknown {
    this.reporter.startGenericValue(position, descriptor);
    let pos = genericPosition(descriptor.type);
    this.visitor.visit(descriptor.args, pos);
    this.reporter.endGenericValue(position, descriptor);
  }

  dictionary(descriptor: DictionaryDescriptor, position: Pos): void {
    this.reporter.startDictionary(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endDictionary(position, descriptor);
  }

  record(descriptor: RecordDescriptor, position: Pos): Inner {
    this.reporter.startRecord(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endRecord(position, descriptor);

    return this.reporter.finish();
  }

  primitive(descriptor: PrimitiveDescriptor, position: Pos): unknown {
    this.reporter.primitiveValue(position, descriptor);
  }

  dictionaryBody(descriptor: DictionaryDescriptor | RecordDescriptor) {
    let members = descriptor.args;
    let keys = Object.keys(members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let position = DictionaryPosition({ index: i, last });

      this.reporter.addKey(position, key, members[key]!.descriptor);
      this.visitor.visit(members[key]!, position);
      this.reporter.endValue(position, members[key]!.descriptor);
    });
  }
}
