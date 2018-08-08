import { Pos, ReporterState } from "./reporter";
import * as visitor from "./visitor";

export class RecordReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
  > {
  startDictionaryBody(): void {
    /* noop */
  }

  startDictionary(position: Pos, descriptor: visitor.Dictionary): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endDictionary(position: Pos, descriptor: visitor.Dictionary): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRecord(position: Pos, descriptor: visitor.Record): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openRecord({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endRecord(position: Pos, descriptor: visitor.Record): void {
    this.pushStrings(
      this.reporters.closeRecord({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  addKey(position: Pos, key: string, descriptor: visitor.Descriptor): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endValue(position: Pos, descriptor: visitor.Descriptor): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endGenericValue(position: Pos, descriptor: visitor.Container): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startGenericValue(position: Pos, descriptor: visitor.Container): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  primitiveValue(position: Pos, descriptor: visitor.Primitive): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
        descriptor,
        position,
        ...this.state
      })
    );
  }
}
