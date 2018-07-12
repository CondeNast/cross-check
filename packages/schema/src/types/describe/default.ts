import {
  CollectionDescriptor,
  DictionaryDescriptor,
  NamedDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  TypeDescriptor
} from "../fundamental/descriptor";
import { Position, ReporterState } from "./reporter";

export class RecordReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  startDictionaryBody(): void {
    /* noop */
  }

  startDictionary(position: Position, descriptor: DictionaryDescriptor): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endDictionary(position: Position, descriptor: DictionaryDescriptor): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRecord(_position: Position, descriptor: RecordDescriptor): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openRecord({
        descriptor,
        ...this.state
      })
    );
  }

  endRecord(_position: Position, descriptor: RecordDescriptor): void {
    this.pushStrings(
      this.reporters.closeRecord({
        descriptor,
        ...this.state
      })
    );
  }

  addKey(key: string, position: Position, required: boolean): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        position,
        required,
        ...this.state
      })
    );
  }

  endValue(position: Position, descriptor: TypeDescriptor): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endGenericValue(position: Position, descriptor: CollectionDescriptor): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startGenericValue(
    position: Position,
    descriptor: CollectionDescriptor
  ): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  primitiveValue(position: Position, descriptor: PrimitiveDescriptor): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
        descriptor,
        position,
        ...this.state
      })
    );
  }

  namedValue(position: Position, descriptor: NamedDescriptor): void {
    this.pushStrings(
      this.reporters.emitNamedType({
        descriptor,
        position,
        ...this.state
      })
    );
  }
}
