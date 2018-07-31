import { builder } from "../../descriptors";
import { Pos, ReporterState } from "./reporter";

export class RecordReporter<Buffer, Inner, Options> extends ReporterState<
  Buffer,
  Inner,
  Options
> {
  startDictionaryBody(): void {
    /* noop */
  }

  startDictionary(position: Pos, descriptor: builder.Dictionary): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endDictionary(position: Pos, descriptor: builder.Dictionary): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRecord(position: Pos, descriptor: builder.Record): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openRecord({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endRecord(position: Pos, descriptor: builder.Record): void {
    this.pushStrings(
      this.reporters.closeRecord({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  addKey(position: Pos, key: string, descriptor: builder.Descriptor): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endValue(position: Pos, descriptor: builder.Descriptor): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endGenericValue(position: Pos, descriptor: builder.Container): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startGenericValue(position: Pos, descriptor: builder.Container): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  primitiveValue(position: Pos, descriptor: builder.Primitive): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
        descriptor,
        position,
        ...this.state
      })
    );
  }
}
