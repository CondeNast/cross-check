import { unknown } from "ts-std";
import {
  AliasDescriptor,
  CollectionDescriptor,
  DictionaryDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor
} from "../fundamental/descriptor";
import { Type } from "../fundamental/value";
import { Accumulator, Position, Reporter, genericPosition } from "./reporter";

export interface VisitorDelegate {
  alias(type: AliasDescriptor, position: Position): unknown;
  generic(type: CollectionDescriptor, position: Position): unknown;
  dictionary(type: DictionaryDescriptor, position: Position): unknown;
  record(type: RecordDescriptor, position: Position): unknown;
  primitive(type: PrimitiveDescriptor, position: Position): unknown;
}

export class Visitor {
  constructor(private delegate: VisitorDelegate) {}

  visit(type: Type, position: Position = Position.Any): unknown {
    let descriptor = type.descriptor;

    switch (descriptor.type) {
      case "Alias": {
        return this.delegate.alias(descriptor, position);
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
        return this.delegate.record(descriptor, position);
      }

      case "Primitive": {
        return this.delegate.primitive(descriptor, position);
      }
    }
  }
}

export interface RecursiveDelegate {
  alias(descriptor: AliasDescriptor): unknown;
  primitive(descriptor: PrimitiveDescriptor, required: boolean): unknown;
  generic(
    of: ItemType<this>,
    descriptor: CollectionDescriptor,
    required: boolean
  ): unknown;
  dictionary(descriptor: DictionaryDescriptor, required: boolean): unknown;
  record(descriptor: RecordDescriptor, required: boolean): unknown;
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

  primitive(descriptor: PrimitiveDescriptor): unknown {
    return this.recursiveDelegate.primitive(descriptor, descriptor.required);
  }

  generic(descriptor: CollectionDescriptor): unknown {
    return this.recursiveDelegate.generic(
      this.visitor.visit(
        descriptor.args,
        genericPosition(descriptor.type)
      ) as ItemType<D>,
      descriptor,
      descriptor.required
    );
  }

  record(descriptor: RecordDescriptor): unknown {
    return this.recursiveDelegate.record(descriptor, descriptor.required);
  }

  dictionary(descriptor: DictionaryDescriptor): unknown {
    return this.recursiveDelegate.dictionary(descriptor, descriptor.required);
  }

  alias(descriptor: AliasDescriptor): unknown {
    return this.recursiveDelegate.alias(descriptor);
  }

  processDictionary(
    descriptor: DictionaryDescriptor | RecordDescriptor,
    callback: (item: ItemType<D>, key: string) => void
  ): unknown {
    let input = descriptor.args;
    let keys = Object.keys(input);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let dictPosition: Position;

      if (i === 0) {
        dictPosition = Position.First;
      } else if (i === last) {
        dictPosition = Position.Last;
      } else {
        dictPosition = Position.Middle;
      }

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

  alias(descriptor: AliasDescriptor, position: Position): unknown {
    this.reporter.namedValue(position, descriptor);
  }

  generic(descriptor: CollectionDescriptor, position: Position): unknown {
    this.reporter.startGenericValue(position, descriptor);

    this.visitor.visit(descriptor.args, genericPosition(descriptor.type));

    this.reporter.endGenericValue(position, descriptor);
  }

  dictionary(descriptor: DictionaryDescriptor, position: Position): void {
    this.reporter.startDictionary(position, descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endDictionary(position, descriptor);
  }

  record(descriptor: RecordDescriptor): Inner {
    this.reporter.startRecord(descriptor);
    this.dictionaryBody(descriptor);
    this.reporter.endRecord(descriptor);

    return this.reporter.finish();
  }

  primitive(descriptor: PrimitiveDescriptor, position: Position): unknown {
    this.reporter.primitiveValue(position, descriptor);
  }

  dictionaryBody(descriptor: DictionaryDescriptor | RecordDescriptor) {
    let members = descriptor.args;
    let keys = Object.keys(members);
    let last = keys.length - 1;

    keys.forEach((key, i) => {
      let itemPosition: Position;

      switch (i) {
        case 0:
          itemPosition = last === 0 ? Position.Only : Position.First;
          break;
        case last:
          itemPosition = Position.Last;
          break;
        default:
          itemPosition = Position.Middle;
      }

      this.reporter.addKey(key, itemPosition, members[key]!.descriptor);
      this.visitor.visit(members[key]!, itemPosition);
      this.reporter.endValue(itemPosition, members[key]!.descriptor);
    });
  }
}
